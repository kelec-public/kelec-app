package com.kelec.widgets

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.actionParametersOf
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.LinearProgressIndicator
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.color.ColorProvider as DayNightColor
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.width
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.size
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
import com.kelec.shared.WidgetHvacFeedback
import com.kelec.shared.WidgetHvacFeedback.Status
import com.kelec.shortcuts.CarShortcuts

/** Couleurs des widgets (jour / nuit), reprises du widget RemoteViews et des widgets iOS. */
object WidgetColors {
    val background = DayNightColor(day = Color.White, night = Color(0xFF1C1C1E))
    val primary = DayNightColor(day = Color.Black, night = Color.White)
    val secondary = ColorProvider(Color(0xFFA5A5A5))
    val track = DayNightColor(day = Color(0xFFE5E5EA), night = Color(0xFF3A3A3C))
    val charging = ColorProvider(Color(0xFF27CD41))
    val notCharging = ColorProvider(Color(0xFF007AFF))
    val error = ColorProvider(Color(0xFFFF3B30))

    /** Vert si la voiture est branchée, sinon [unplugged] (comme `chargingColour` sur iOS). */
    fun chargingColour(battery: BatteryStatus, unplugged: ColorProvider = notCharging): ColorProvider =
        if (battery.isPlugged) charging else unplugged
}

/** Fond du widget ; toucher le widget ouvre l'app, sur la page de [vin] s'il affiche une voiture. */
@Composable
fun GlanceModifier.widgetContainer(vin: String? = null): GlanceModifier =
    fillMaxSize()
        .background(WidgetColors.background)
        .cornerRadius(16.dp)
        .clickable(
            if (vin == null) actionStartActivity<MainActivity>()
            else actionStartActivity(CarShortcuts.openIntent(LocalContext.current, vin))
        )

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

/** Heure de la dernière mise à jour avec l'icône de rechargement ; la toucher relance le chargement. */
@Composable
fun LastRefreshLabel(battery: BatteryStatus, fontSize: TextUnit = 11.sp) {
    val context = LocalContext.current
    val text = Formatting.parseTimestamp(battery.timestamp)?.let { Formatting.lastRefresh(context, it) } ?: "--:--"
    Row(
        modifier = GlanceModifier.clickable(actionRunCallback<RefreshWidgetsAction>()),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // même gris que l'heure : l'icône noire du drawable ne se voyait pas en mode sombre
        Image(
            provider = ImageProvider(R.drawable.refresh_24),
            contentDescription = null,
            modifier = GlanceModifier.size((fontSize.value + 4).dp),
            colorFilter = ColorFilter.tint(WidgetColors.secondary),
        )
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

/**
 * Bouton de confort thermique, avec son retour : envoi en cours, puis réussite (vert) ou erreur (rouge).
 * Inactif pendant l'envoi ; après une erreur, il peut être touché à nouveau.
 * - complet (4x2) : icône et « 21°C » (« Erreur » après un échec) ;
 * - [compact] (barre 4x1, carré 2x2, widgets Tempo) : pastille ronde avec l'icône seule, pour tenir à la taille minimale.
 */
@Composable
fun HvacButton(vin: String, feedback: WidgetHvacFeedback?, compact: Boolean = false) {
    val context = LocalContext.current
    val status = feedback?.status
    val temperature = "${WidgetHvacFeedback.TEMPERATURE}°C"
    val (text, colour) = when (status) {
        Status.SUCCESS -> temperature to WidgetColors.charging
        Status.ERROR -> context.getString(R.string.widget_pre_heat_error) to WidgetColors.error
        Status.SENDING -> temperature to WidgetColors.secondary
        null -> temperature to WidgetColors.primary
    }
    val description = context.getString(
        if (status == Status.SUCCESS) R.string.widget_pre_heat_launched else R.string.widget_launch_pre_heat
    )
    val iconSize = if (compact) 14.dp else 16.dp
    val icon = @Composable {
        if (status == Status.SENDING) {
            CircularProgressIndicator(modifier = GlanceModifier.size(iconSize - 2.dp), color = WidgetColors.primary)
        } else {
            val drawable = when (status) {
                Status.SUCCESS -> R.drawable.ic_check_24
                Status.ERROR -> R.drawable.ic_close_24
                else -> R.drawable.ic_hvac_24
            }
            Image(
                provider = ImageProvider(drawable),
                contentDescription = description,
                modifier = GlanceModifier.size(iconSize),
                colorFilter = ColorFilter.tint(colour),
            )
        }
    }

    var modifier = if (compact) {
        GlanceModifier.size(26.dp).background(WidgetColors.track).cornerRadius(13.dp)
    } else {
        GlanceModifier.height(28.dp).background(WidgetColors.track).cornerRadius(14.dp).padding(horizontal = 10.dp)
    }
    if (status != Status.SENDING) {
        modifier = modifier.clickable(actionRunCallback<LaunchHvacAction>(actionParametersOf(LaunchHvacAction.VIN to vin)))
    }

    if (compact) {
        Box(modifier = modifier, contentAlignment = Alignment.Center) { icon() }
    } else {
        Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
            icon()
            Spacer(GlanceModifier.width(4.dp))
            Text(text = text, style = TextStyle(color = colour, fontSize = 13.sp, fontWeight = FontWeight.Medium), maxLines = 1)
        }
    }
}
