package com.kelec

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.kelec.shared.SharedStore
import com.kelec.widgets.WidgetRefreshWorker
import com.kelec.widgets.WidgetUpdater
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Widget de l'écran d'accueil (batterie, charge, autonomie).
 * NE PAS RENOMMER la classe ni la déplacer : le lanceur garde les widgets posés par ce nom.
 */
class KelecMainWIdget : AppWidgetProvider() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            AppWidgetManager.ACTION_APPWIDGET_UPDATE, ACTION_AUTO_UPDATE, REFRESH_WIDGET_ACTION -> refreshAsync(context)
            else -> super.onReceive(context, intent)
        }
    }

    private fun refreshAsync(context: Context) {
        val pending = goAsync()
        val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(ComponentName(context, KelecMainWIdget::class.java))
        scope.launch {
            try {
                WidgetUpdater.update(context.applicationContext, ids)
            } catch (e: Exception) {
                Log.e(TAG, "Unable to update widgets", e)
            } finally {
                pending.finish()
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        val store = SharedStore(context)
        appWidgetIds.forEach { store.clearWidgetVin(it) }
    }

    override fun onEnabled(context: Context) {
        WidgetRefreshWorker.schedule(context)
    }

    override fun onDisabled(context: Context) {
        WidgetRefreshWorker.cancel(context)
    }

    companion object {
        const val REFRESH_WIDGET_ACTION = "REFRESH_WIDGET_ACTION"
        const val ACTION_AUTO_UPDATE = "AUTO_UPDATE"

        private const val TAG = "KelecMainWIdget"
        private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

        /** Recharge tous les widgets (bridge RN, rafraîchissement périodique). */
        fun requestUpdate(context: Context) {
            context.sendBroadcast(Intent(context, KelecMainWIdget::class.java).setAction(ACTION_AUTO_UPDATE))
        }
    }
}
