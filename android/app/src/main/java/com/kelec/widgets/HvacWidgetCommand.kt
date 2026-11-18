package com.kelec.widgets

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.ForegroundInfo
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.kelec.ApiKeys
import com.kelec.R
import com.kelec.shared.SharedHistory
import com.kelec.shared.SharedStore
import com.kelec.shared.VehicleCommands
import com.kelec.shared.WidgetHvacFeedback
import com.kelec.shared.WidgetHvacFeedback.Status
import java.util.concurrent.TimeUnit

/**
 * Bouton de confort thermique des widgets : lance le préchauffage à [WidgetHvacFeedback.TEMPERATURE] °C.
 * Le widget affiche tout de suite « envoi en cours » sur toute sa taille, puis la réussite ou l'échec jusqu'à OK ou
 * pendant [WidgetHvacFeedback.DISPLAY_DURATION_MS] (état enregistré par voiture et relu par [WidgetData]).
 */
class LaunchHvacAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val vin = parameters[VIN] ?: return
        val store = SharedStore(context)
        // un envoi est déjà en cours pour cette voiture
        if (store.widgetHvacFeedback(vin)?.status == Status.SENDING) return
        store.saveWidgetHvacFeedback(vin, WidgetHvacFeedback(Status.SENDING, System.currentTimeMillis()))
        WidgetUpdater.redrawAll(context)
        // la requête se fait dans un worker : le BroadcastReceiver de Glance est limité à ~10 s (goAsync)
        HvacWidgetWorker.launch(context, vin)
    }

    companion object {
        val VIN = ActionParameters.Key<String>("vin")
    }
}

/**
 * Envoie la commande, enregistre le résultat, puis programme son effacement.
 * Tâche « expedited » : l'utilisateur attend le retour, et une tâche normale peut être retardée quand l'app est
 * dans un bucket App Standby bas. Sans quota disponible, elle part comme une tâche normale.
 */
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
        WidgetUpdater.redrawAll(applicationContext)
        HvacFeedbackClearWorker.schedule(applicationContext, vin)
        return Result.success()
    }

    /**
     * Android 11 et avant : une tâche expedited tourne dans un service au premier plan, qui exige une notification
     * (affichée le temps de l'envoi). À partir d'Android 12, c'est une tâche JobScheduler expedited, sans notification.
     */
    override suspend fun getForegroundInfo(): ForegroundInfo {
        val context = applicationContext
        val title = context.getString(R.string.widget_launch_pre_heat)
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, title, NotificationManager.IMPORTANCE_LOW))
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_hvac_24)
            .setContentTitle(title)
            .setProgress(0, 0, true)
            .setOngoing(true)
            .setSilent(true)
            .build()
        return ForegroundInfo(NOTIFICATION_ID, notification)
    }

    companion object {
        const val KEY_VIN = "vin"
        private const val CHANNEL_ID = "kelec_widget_hvac"
        private const val NOTIFICATION_ID = 4821

        fun launch(context: Context, vin: String) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                "kelec_widget_hvac_$vin",
                ExistingWorkPolicy.KEEP,
                OneTimeWorkRequestBuilder<HvacWidgetWorker>()
                    .setInputData(workDataOf(KEY_VIN to vin))
                    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                    .build(),
            )
        }
    }
}

/** Bouton OK du retour : le widget revient à la voiture sans attendre [WidgetHvacFeedback.DISPLAY_DURATION_MS]. */
class DismissHvacFeedbackAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val vin = parameters[LaunchHvacAction.VIN] ?: return
        val store = SharedStore(context)
        // pas d'OK pendant l'envoi, mais un nouvel envoi a pu partir entre-temps
        if (store.widgetHvacFeedback(vin)?.status == Status.SENDING) return
        store.clearWidgetHvacFeedback(vin)
        WidgetUpdater.redrawAll(context)
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
            WidgetUpdater.redrawAll(applicationContext)
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
