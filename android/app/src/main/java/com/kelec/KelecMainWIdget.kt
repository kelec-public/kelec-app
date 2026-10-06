package com.kelec

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import com.kelec.shared.SharedStore
import com.kelec.widgets.WidgetRefreshWorker

/**
 * Widget de l'écran d'accueil (batterie, charge, autonomie). Le chargement se fait dans [WidgetRefreshWorker].
 * NE PAS RENOMMER la classe ni la déplacer : le lanceur garde les widgets posés par ce nom.
 */
class KelecMainWIdget : AppWidgetProvider() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            AppWidgetManager.ACTION_APPWIDGET_UPDATE, ACTION_AUTO_UPDATE, REFRESH_WIDGET_ACTION ->
                WidgetRefreshWorker.refreshNow(context)
            else -> super.onReceive(context, intent)
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

        /** Recharge tous les widgets (bridge RN, choix de la voiture d'un widget). */
        fun requestUpdate(context: Context) {
            WidgetRefreshWorker.refreshNow(context)
        }
    }
}
