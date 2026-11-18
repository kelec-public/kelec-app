package com.kelec.widgets

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.kelec.ApiKeys
import com.kelec.shared.SharedHistory
import com.kelec.shared.SharedStore
import com.kelec.shared.VehicleCommands
import com.kelec.shared.WidgetHvacFeedback
import com.kelec.shared.WidgetHvacFeedback.Status
import java.util.concurrent.TimeUnit

/**
 * Bouton de confort thermique du widget 4x2 : lance le préchauffage à [WidgetHvacFeedback.TEMPERATURE] °C.
 * Le widget affiche tout de suite « envoi en cours », puis la réussite ou l'échec pendant
 * [WidgetHvacFeedback.DISPLAY_DURATION_MS] (état enregistré par voiture et relu par [WidgetData]).
 */
class LaunchHvacAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val vin = parameters[VIN] ?: return
        val store = SharedStore(context)
        // un envoi est déjà en cours pour cette voiture
        if (store.widgetHvacFeedback(vin)?.status == Status.SENDING) return
        store.saveWidgetHvacFeedback(vin, WidgetHvacFeedback(Status.SENDING, System.currentTimeMillis()))
        WidgetRedraw.all(context, CarStatusWidget())
        // la requête se fait dans un worker : le BroadcastReceiver de Glance est limité à ~10 s (goAsync)
        HvacWidgetWorker.launch(context, vin)
    }

    companion object {
        val VIN = ActionParameters.Key<String>("vin")
    }
}

/** Envoie la commande, enregistre le résultat, puis programme son effacement. */
class HvacWidgetWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val vin = inputData.getString(KEY_VIN) ?: return Result.failure()
        val store = SharedStore(applicationContext)
        val history = SharedHistory(applicationContext)
        val car = store.loadAccount()?.cars?.firstOrNull { it.vin == vin }
        val sent = if (car == null) {
            history.writeWidgetLog("HVAC widget: car not found")
            false
        } else {
            VehicleCommands(applicationContext, ApiKeys.renault).launchHvac(car, WidgetHvacFeedback.TEMPERATURE)
        }
        history.writeWidgetLog(if (sent) "HVAC widget: command sent" else "HVAC widget: command not sent")
        store.saveWidgetHvacFeedback(vin, WidgetHvacFeedback(if (sent) Status.SUCCESS else Status.ERROR, System.currentTimeMillis()))
        WidgetRedraw.all(applicationContext, CarStatusWidget())
        HvacFeedbackClearWorker.schedule(applicationContext, vin)
        return Result.success()
    }

    companion object {
        const val KEY_VIN = "vin"

        fun launch(context: Context, vin: String) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                "kelec_widget_hvac_$vin",
                ExistingWorkPolicy.KEEP,
                OneTimeWorkRequestBuilder<HvacWidgetWorker>().setInputData(workDataOf(KEY_VIN to vin)).build(),
            )
        }
    }
}

/** Efface la réussite ou l'échec affiché par le widget une fois sa durée passée. */
class HvacFeedbackClearWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val vin = inputData.getString(HvacWidgetWorker.KEY_VIN) ?: return Result.failure()
        val store = SharedStore(applicationContext)
        // widgetHvacFeedback est null une fois expiré ; un nouvel envoi (SENDING) est gardé
        if (store.widgetHvacFeedback(vin)?.status != Status.SENDING) {
            store.clearWidgetHvacFeedback(vin)
            WidgetRedraw.all(applicationContext, CarStatusWidget())
        }
        return Result.success()
    }

    companion object {
        fun schedule(context: Context, vin: String) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                "kelec_widget_hvac_clear_$vin",
                ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<HvacFeedbackClearWorker>()
                    .setInputData(workDataOf(HvacWidgetWorker.KEY_VIN to vin))
                    .setInitialDelay(WidgetHvacFeedback.DISPLAY_DURATION_MS, TimeUnit.MILLISECONDS)
                    .build(),
            )
        }
    }
}
