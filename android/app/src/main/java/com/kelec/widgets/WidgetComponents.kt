package com.kelec.widgets

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.color.ColorProvider as DayNightColor
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.kelec.MainActivity
import com.kelec.R
import com.kelec.carapi.BatteryStatus
import com.kelec.shared.CarMaker
import com.kelec.shared.Formatting

/** Couleurs des widgets (jour / nuit), reprises du widget RemoteViews et des widgets iOS. */
object WidgetColors {
    val background = DayNightColor(day = Color.White, night = Color(0xFF1C1C1E))
    val primary = DayNightColor(day = Color.Black, night = Color.White)
    val secondary = ColorProvider(Color(0xFFA5A5A5))
    val track = DayNightColor(day = Color(0xFFE5E5EA), night = Color(0xFF3A3A3C))
    val charging = ColorProvider(Color(0xFF27CD41))
    val notCharging = ColorProvider(Color(0xFF007AFF))

    /** Vert si la voiture est branchée, sinon [unplugged] (comme `chargingColour` sur iOS). */
    fun chargingColour(battery: BatteryStatus, unplugged: ColorProvider = notCharging): ColorProvider =
        if (battery.isPlugged) charging else unplugged
}

/** Fond du widget ; toucher le widget ouvre l'app. */
fun GlanceModifier.widgetContainer(): GlanceModifier =
    fillMaxSize()
        .background(WidgetColors.background)
        .cornerRadius(16.dp)
        .clickable(actionStartActivity<MainActivity>())

/** Message centré (pas connecté, aucune voiture, erreur serveur). */
@Composable
fun WidgetMessage(text: String) {
    Box(modifier = GlanceModifier.widgetContainer().padding(12.dp), contentAlignment = Alignment.Center) {
        Text(
            text = text,
            style = TextStyle(color = WidgetColors.primary, fontSize = 13.sp, textAlign = TextAlign.Center),
        )
    }
}

@Composable
fun CarMakerLogo(maker: CarMaker, modifier: GlanceModifier = GlanceModifier) {
    val logo = when (maker) {
        CarMaker.ALPINE -> R.drawable.alpine_logo
        CarMaker.DACIA -> R.drawable.dacia_logo
        else -> R.drawable.renault_logo
    }
    Image(provider = ImageProvider(logo), contentDescription = null, modifier = modifier, contentScale = ContentScale.Fit)
}

/** Image de la voiture enregistrée par l'app, sinon le logo du constructeur. */
@Composable
fun CarImage(state: CarWidgetState.Loaded, modifier: GlanceModifier = GlanceModifier) {
    val image = state.image
    if (image != null) {
        Image(provider = ImageProvider(image), contentDescription = state.car.model, modifier = modifier, contentScale = ContentScale.Fit)
    } else {
        CarMakerLogo(state.car.maker, modifier)
    }
}

/** Jauge de batterie : verte si branchée, bleue sinon. */
@Composable
fun BatteryBar(battery: BatteryStatus, height: Int = 10) {
    LinearProgressIndicator(
        progress = (battery.batteryLevel ?: 0) / 100f,
        modifier = GlanceModifier.fillMaxWidth().height(height.dp).cornerRadius((height / 2).dp),
        color = WidgetColors.chargingColour(battery),
        backgroundColor = WidgetColors.track,
    )
}

/** Heure de la dernière mise à jour ; la toucher relance le chargement. */
@Composable
fun LastRefreshLabel(battery: BatteryStatus, fontSize: TextUnit = 11.sp, withIcon: Boolean = false) {
    val text = Formatting.parseTimestamp(battery.timestamp)?.let { Formatting.lastRefresh(it) } ?: "--:--"
    Row(
        modifier = GlanceModifier.clickable(actionRunCallback<RefreshWidgetsAction>()),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (withIcon) {
            Image(
                provider = ImageProvider(R.drawable.refresh_24),
                contentDescription = null,
                modifier = GlanceModifier.height(16.dp),
            )
        }
        Text(text = text, style = TextStyle(color = WidgetColors.secondary, fontSize = fontSize))
    }
}

/** « 62 » en gras suivi de « % » en gris. */
@Composable
fun BatteryLevelText(battery: BatteryStatus, fontSize: TextUnit, colour: ColorProvider = WidgetColors.primary) {
    Row(verticalAlignment = Alignment.Bottom) {
        Text(
            text = (battery.batteryLevel ?: 0).toString(),
            style = TextStyle(color = colour, fontSize = fontSize, fontWeight = FontWeight.Bold),
        )
        Text(text = "%", style = TextStyle(color = WidgetColors.secondary, fontSize = fontSize))
    }
}
