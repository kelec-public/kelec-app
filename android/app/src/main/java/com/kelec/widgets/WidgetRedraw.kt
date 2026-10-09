package com.kelec.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.currentState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Redessin des widgets après une mise à jour du cache.
 * Glance garde la session d'un widget ouverte ~45 s après un rendu : pendant ce temps, update() recompose le contenu
 * sans relancer provideGlance, et un état lu avant provideContent resterait l'ancien (mauvaise voiture, erreur).
 * On incrémente donc une version dans l'état Glance du widget, et [rememberWidgetData] relit le cache quand elle change.
 */
object WidgetRedraw {
    private val DATA_VERSION = longPreferencesKey("data_version")

    /** Redessine tous les widgets de ce type en relisant le cache. */
    suspend fun all(context: Context, widget: GlanceAppWidget) {
        GlanceAppWidgetManager(context).getGlanceIds(widget.javaClass).forEach { id ->
            updateAppWidgetState(context, id) { it[DATA_VERSION] = (it[DATA_VERSION] ?: 0L) + 1 }
            widget.update(context, id)
        }
    }

    /** Données du widget : [initial] (lues dans provideGlance), puis relues avec [load] à chaque [all]. */
    @Composable
    fun <T> rememberWidgetData(initial: T, load: () -> T): T {
        val version = currentState(DATA_VERSION) ?: 0L
        val data by produceState(initial, version) { value = withContext(Dispatchers.IO) { load() } }
        return data
    }
}
