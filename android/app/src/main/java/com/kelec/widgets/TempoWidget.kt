package com.kelec.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.kelec.R
import com.kelec.carapi.Tempo
import com.kelec.carapi.TempoColour
import com.kelec.carapi.TempoDay
import com.kelec.shared.Formatting
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Widgets Tempo 4x2 (comme sur iOS) : la voiture à gauche (vue du widget 2x2), Tempo à droite.
 * - [TempoWidget] : le dernier jour connu avec les prix heures pleines / heures creuses ;
 * - [Tempo2DaysWidget] : les deux derniers jours connus (veille et aujourd'hui, ou aujourd'hui et demain).
 */
abstract class TempoWidgetBase(private val twoDays: Boolean) : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val load = {
            WidgetData.carState(context, appWidgetId, serverError = R.string.tempo_car_server_error) to WidgetData.tempo(context)
        }
        val initial = withContext(Dispatchers.IO) { load() }
        provideContent {
            val (state, tempo) = WidgetRedraw.rememberWidgetData(initial, load)
            TempoContent(state, tempo, twoDays)
        }
    }
}

class TempoWidget : TempoWidgetBase(twoDays = false)

class Tempo2DaysWidget : TempoWidgetBase(twoDays = true)

@Composable
private fun TempoContent(state: CarWidgetState, tempo: Tempo?, twoDays: Boolean) {
    when {
        state is CarWidgetState.Message -> WidgetMessage(state.text)
        tempo == null -> WidgetMessage(LocalContext.current.getString(R.string.tempo_rte_server_error))
        state is CarWidgetState.Loaded -> Row(modifier = GlanceModifier.widgetContainer(state.car.vin)) {
            CarSquareView(state, GlanceModifier.defaultWeight().fillMaxHeight())
            Column(modifier = GlanceModifier.defaultWeight().fillMaxHeight()) {
                if (twoDays) {
                    TempoDayView(tempo.previous, withPrices = false, modifier = GlanceModifier.fillMaxWidth().defaultWeight())
                    TempoDayView(tempo.latest, withPrices = false, modifier = GlanceModifier.fillMaxWidth().defaultWeight())
                } else {
                    TempoDayView(tempo.latest, withPrices = true, modifier = GlanceModifier.fillMaxWidth().defaultWeight())
                }
            }
        }
    }
}

/** Un jour Tempo sur sa couleur : date, couleur, et les prix HP / HC si demandés. */
@Composable
private fun TempoDayView(day: TempoDay, withPrices: Boolean, modifier: GlanceModifier) {
    val foreground = ColorProvider(TempoColours.foreground(day.colour))
    Column(
        modifier = modifier.background(TempoColours.background(day.colour)).padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = Formatting.dayMonth(day.date),
            style = TextStyle(color = foreground, fontSize = 18.sp, fontWeight = FontWeight.Bold),
        )
        Text(
            text = colourLabel(LocalContext.current, day.colour),
            style = TextStyle(color = foreground, fontSize = 20.sp, fontWeight = FontWeight.Bold),
        )
        if (withPrices) {
            Spacer(GlanceModifier.height(6.dp))
            Text(text = "HP ${Formatting.tempoPrice(day.colour.hpPrice)}", style = TextStyle(color = foreground, fontSize = 11.sp))
            Text(text = "HC ${Formatting.tempoPrice(day.colour.hcPrice)}", style = TextStyle(color = foreground, fontSize = 11.sp))
        }
    }
}

private fun colourLabel(context: Context, colour: TempoColour): String = when (colour) {
    TempoColour.BLUE -> context.getString(R.string.tempo_blue)
    TempoColour.WHITE -> context.getString(R.string.tempo_white)
    TempoColour.RED -> context.getString(R.string.tempo_red)
    TempoColour.UNKNOWN -> "?"
}

/** Couleurs des jours Tempo (celles de `TempoStyle` sur iOS). */
private object TempoColours {
    fun background(colour: TempoColour): Color = when (colour) {
        TempoColour.BLUE -> Color(0xFF007AFF)
        TempoColour.WHITE -> Color.White
        TempoColour.RED -> Color(0xFFFF3B30)
        TempoColour.UNKNOWN -> Color(0xFFFF2D55)
    }

    fun foreground(colour: TempoColour): Color = if (colour == TempoColour.WHITE) Color.Black else Color.White
}
