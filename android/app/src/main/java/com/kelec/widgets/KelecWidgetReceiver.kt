package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import com.kelec.shared.SharedStore

/**
 * Comportement commun des widgets : Glance dessine depuis le cache (sans réseau), et tout chargement réseau
 * passe par [WidgetRefreshWorker], qui redessine ensuite les widgets.
 */
abstract class KelecWidgetReceiver : GlanceAppWidgetReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            // pose du widget, redémarrage : on dessine tout de suite avec le cache, puis on recharge
            AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
                super.onReceive(context, intent)
                WidgetRefreshWorker.refreshNow(context)
            }
            // anciennes actions (boutons des widgets RemoteViews encore affichés)
            ACTION_AUTO_UPDATE, REFRESH_WIDGET_ACTION -> WidgetRefreshWorker.refreshNow(context)
            else -> super.onReceive(context, intent)
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        val store = SharedStore(context)
        appWidgetIds.forEach { store.clearWidgetVin(it) }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WidgetRefreshWorker.schedule(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        // la tâche périodique sert à tous les types de widgets
        if (WidgetRefreshWorker.widgetIds(context).isEmpty()) WidgetRefreshWorker.cancel(context)
    }

    companion object {
        const val REFRESH_WIDGET_ACTION = "REFRESH_WIDGET_ACTION"
        const val ACTION_AUTO_UPDATE = "AUTO_UPDATE"
    }
}

/** NE PAS RENOMMER : référencé par le manifeste, le lanceur garde les widgets posés par ce nom. */
class KelecTempoWidgetReceiver : KelecWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TempoWidget()
}

/** NE PAS RENOMMER : référencé par le manifeste, le lanceur garde les widgets posés par ce nom. */
class KelecTempo2DaysWidgetReceiver : KelecWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = Tempo2DaysWidget()
}

/** Toucher l'heure de mise à jour d'un widget recharge les données. */
class RefreshWidgetsAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        WidgetRefreshWorker.refreshNow(context)
    }
}
