package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.kelec.KelecMainWIdget
import java.util.concurrent.TimeUnit

/**
 * Recharge les widgets en arrière-plan : toutes les 15 min, et à la demande (bridge RN, bouton du widget).
 * Le travail se fait ici plutôt que dans le BroadcastReceiver, limité à ~10 s par goAsync().
 * NE PAS RENOMMER la classe ni [PERIODIC_WORK] : WorkManager garde la tâche périodique avec ces noms.
 */
class WidgetRefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        WidgetUpdater.update(applicationContext)
        return Result.success()
    }

    companion object {
        private const val PERIODIC_WORK = "kelec_widget_refresh"
        private const val ONE_TIME_WORK = "kelec_widget_refresh_now"

        /** Tous les widgets posés, tous types confondus (batterie, Tempo, Tempo 2 jours). */
        fun widgetIds(context: Context): IntArray {
            val manager = AppWidgetManager.getInstance(context)
            return listOf(KelecMainWIdget::class.java, KelecTempoWidgetReceiver::class.java, KelecTempo2DaysWidgetReceiver::class.java)
                .map { WidgetUpdater.idsOf(context, manager, it) }
                .fold(IntArray(0)) { all, ids -> all + ids }
        }

        /**
         * Recharge les widgets maintenant (sans effet s'il n'y en a aucun). Une demande faite pendant un chargement
         * passe après lui (APPEND) au lieu de l'annuler : à la pose, la pose, le choix de la voiture et l'app RN
         * relancent le chargement presque en même temps, et REPLACE l'annulait à chaque fois.
         * La tâche périodique est aussi (re)programmée : tant qu'une tâche reste en attente, WorkManager ne désactive pas
         * son RescheduleReceiver, ce qui renverrait APPWIDGET_UPDATE et relancerait un rafraîchissement en boucle.
         */
        fun refreshNow(context: Context) {
            if (widgetIds(context).isEmpty()) return
            schedule(context)
            WorkManager.getInstance(context).enqueueUniqueWork(
                ONE_TIME_WORK, ExistingWorkPolicy.APPEND_OR_REPLACE, OneTimeWorkRequestBuilder<WidgetRefreshWorker>().build()
            )
        }

        fun schedule(context: Context) {
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_WORK,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<WidgetRefreshWorker>(15, TimeUnit.MINUTES).build()
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK)
            WorkManager.getInstance(context).cancelUniqueWork(ONE_TIME_WORK)
        }
    }
}
