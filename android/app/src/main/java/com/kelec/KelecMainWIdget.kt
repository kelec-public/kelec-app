package com.kelec

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import com.kelec.widgets.CarStatusWidget
import com.kelec.widgets.KelecWidgetReceiver
import com.kelec.widgets.WidgetRefreshWorker

/**
 * Widget batterie de l'écran d'accueil (4x1, 2x2, 4x2), dessiné par [CarStatusWidget].
 * Le chargement se fait dans [WidgetRefreshWorker].
 * NE PAS RENOMMER la classe ni la déplacer : le lanceur garde les widgets posés par ce nom.
 */
class KelecMainWIdget : KelecWidgetReceiver() {

    override val glanceAppWidget: GlanceAppWidget = CarStatusWidget()

    companion object {
        /** Recharge tous les widgets (bridge RN, choix de la voiture d'un widget). */
        fun requestUpdate(context: Context) {
            WidgetRefreshWorker.refreshNow(context)
        }
    }
}
