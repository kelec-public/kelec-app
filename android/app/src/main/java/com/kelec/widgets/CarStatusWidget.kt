package com.kelec.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import com.kelec.R
import com.kelec.carapi.BatteryStatus
import com.kelec.shared.Formatting
import com.kelec.shared.label
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.temporal.ChronoUnit

/**
 * Widget batterie de la voiture (receiver [com.kelec.KelecMainWIdget]). Redimensionnable, trois mises en page :
 * - barre 4x1 : le widget historique ;
 * - carré 2x2 : comme le petit widget iOS ;
 * - large 4x2 : comme le widget moyen iOS.
 */
class CarStatusWidget : GlanceAppWidget() {

    override val sizeMode = SizeMode.Responsive(setOf(BAR, SQUARE, LARGE))

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
        val state = withContext(Dispatchers.IO) { WidgetData.carState(context, appWidgetId) }
        provideContent { CarStatusContent(state) }
    }

    companion object {
        val BAR = DpSize(110.dp, 40.dp)
        val SQUARE = DpSize(110.dp, 110.dp)
        val LARGE = DpSize(250.dp, 110.dp)
    }
}

@Composable
private fun CarStatusContent(state: CarWidgetState) {
    when (state) {
        is CarWidgetState.Message -> WidgetMessage(state.text)
        is CarWidgetState.Loaded -> {
            val size = LocalSize.current
            when {
                size.height < CarStatusWidget.SQUARE.height -> CarBarView(state)
                size.width < CarStatusWidget.LARGE.width -> CarSquareView(state)
                else -> CarLargeView(state)
            }
        }
    }
}

/** 4x1 : logo, nom et niveau, jauge, état de charge et autonomie, temps de charge, heure (bouton de rechargement). */
@Composable
private fun CarBarView(state: CarWidgetState.Loaded) {
    val battery = state.battery
    Column(modifier = GlanceModifier.widgetContainer(state.car.vin).padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            CarMakerLogo(state.car.maker, GlanceModifier.size(25.dp, 20.dp))
            Spacer(GlanceModifier.width(6.dp))
            Text(
                text = state.car.model,
                style = TextStyle(color = WidgetColors.primary, fontSize = 14.sp),
                maxLines = 1,
                modifier = GlanceModifier.defaultWeight(),
            )
            BatteryLevelText(battery, 16.sp)
        }
        Spacer(GlanceModifier.height(4.dp))
        BatteryBar(battery)
        Spacer(GlanceModifier.height(4.dp))
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                ChargeAndRange(state, 12)
                if (battery.isPlugged) ChargingTimes(battery, 12)
            }
            LastRefreshLabel(battery, 12.sp)
        }
    }
}

/** 2x2 : nom, niveau et autonomie (ou temps de charge), image de la voiture, heure. Aussi la moitié gauche des widgets Tempo. */
@Composable
internal fun CarSquareView(state: CarWidgetState.Loaded, modifier: GlanceModifier = GlanceModifier.widgetContainer(state.car.vin)) {
    val battery = state.battery
    val level = battery.batteryLevel ?: 0
    Column(modifier = modifier.padding(12.dp)) {
        Text(
            text = state.car.model,
            style = TextStyle(color = WidgetColors.primary, fontSize = 15.sp, textAlign = TextAlign.Center),
            maxLines = 1,
            modifier = GlanceModifier.fillMaxWidth(),
        )
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (battery.isPlugged) {
                Image(provider = ImageProvider(R.drawable.ic_bolt_24), contentDescription = null, modifier = GlanceModifier.size(13.dp))
            }
            BatteryLevelText(battery, 13.sp, WidgetColors.chargingColour(battery, unplugged = WidgetColors.primary))
            Text(text = " | ", style = TextStyle(color = WidgetColors.secondary, fontSize = 13.sp))
            if (battery.chargingState.isActivelyCharging(level)) {
                Image(provider = ImageProvider(R.drawable.ic_baseline_hourglass_top_24), contentDescription = null, modifier = GlanceModifier.size(13.dp))
                Text(
                    text = Formatting.duration(battery.chargingRemainingTime ?: 0),
                    style = TextStyle(color = WidgetColors.primary, fontSize = 13.sp),
                )
            } else {
                Text(
                    text = Formatting.range(battery.batteryAutonomy ?: 0, state.prefs),
                    style = TextStyle(color = WidgetColors.secondary, fontSize = 13.sp),
                )
            }
        }
        Box(modifier = GlanceModifier.fillMaxWidth().defaultWeight(), contentAlignment = Alignment.BottomEnd) {
            CarImage(state, GlanceModifier.fillMaxSize().padding(top = 4.dp, bottom = 8.dp))
            LastRefreshLabel(battery, 10.sp)
        }
    }
}

/** 4x2 : logo, nom et niveau, jauge, état de charge et autonomie, heure, temps de charge et image de la voiture. */
@Composable
private fun CarLargeView(state: CarWidgetState.Loaded) {
    val battery = state.battery
    Column(modifier = GlanceModifier.widgetContainer(state.car.vin).padding(14.dp)) {
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            CarMakerLogo(state.car.maker, GlanceModifier.size(30.dp, 22.dp))
            Spacer(GlanceModifier.width(5.dp))
            Text(
                text = state.car.model,
                style = TextStyle(color = WidgetColors.primary, fontSize = 15.sp),
                maxLines = 1,
                modifier = GlanceModifier.defaultWeight(),
            )
            BatteryLevelText(battery, 26.sp)
        }
        Spacer(GlanceModifier.height(6.dp))
        BatteryBar(battery, height = 14)
        Spacer(GlanceModifier.height(6.dp))
        Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Row(modifier = GlanceModifier.defaultWeight()) { ChargeAndRange(state, 13) }
            LastRefreshLabel(battery, 12.sp)
        }
        Row(modifier = GlanceModifier.fillMaxWidth().defaultWeight(), verticalAlignment = Alignment.Bottom) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                if (battery.isPlugged) ChargingTimes(battery, 13)
            }
            CarImage(state, GlanceModifier.width(120.dp).fillMaxHeight())
        }
    }
}

/** « EN CHARGE | 245 km » (l'état seulement si la voiture est branchée). */
@Composable
private fun ChargeAndRange(state: CarWidgetState.Loaded, fontSize: Int) {
    val battery = state.battery
    Row {
        if (battery.isPlugged) {
            Text(
                text = battery.chargingState.label(LocalContext.current),
                style = TextStyle(color = WidgetColors.primary, fontSize = fontSize.sp),
            )
        }
        Text(
            text = Formatting.range(battery.batteryAutonomy ?: 0, state.prefs),
            style = TextStyle(color = WidgetColors.secondary, fontSize = fontSize.sp),
        )
    }
}

/** Temps de charge restant et heure de fin, « --h-- » si la voiture ne charge pas activement. */
@Composable
private fun ChargingTimes(battery: BatteryStatus, fontSize: Int) {
    val level = battery.batteryLevel ?: 0
    val remaining = battery.chargingRemainingTime ?: 0
    // heure de fin : seulement si la voiture charge activement et que l'heure du statut est connue
    val endTime = Formatting.parseTimestamp(battery.timestamp)
        ?.takeIf { battery.chargingState.isActivelyCharging(level) }
        ?.plus(remaining.toLong(), ChronoUnit.MINUTES)
    val iconSize = (fontSize + 2).dp

    Row(modifier = GlanceModifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Image(provider = ImageProvider(R.drawable.ic_baseline_hourglass_top_24), contentDescription = null, modifier = GlanceModifier.size(iconSize))
        Text(
            text = if (endTime != null) Formatting.duration(remaining) else "--h--",
            style = TextStyle(color = WidgetColors.primary, fontSize = fontSize.sp),
        )
        if (endTime != null) {
            Spacer(GlanceModifier.width(8.dp))
            Image(
                provider = ImageProvider(R.drawable.ic_baseline_battery_full_24),
                contentDescription = null,
                modifier = GlanceModifier.size(iconSize),
                colorFilter = ColorFilter.tint(WidgetColors.secondary),
            )
            Text(
                text = Formatting.localTime(endTime),
                style = TextStyle(color = WidgetColors.secondary, fontSize = fontSize.sp),
            )
        }
    }
}
