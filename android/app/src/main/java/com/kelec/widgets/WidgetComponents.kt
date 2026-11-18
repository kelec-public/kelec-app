package com.kelec.widgets

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.annotation.DrawableRes
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.Action
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
import androidx.glance.layout.Column
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

/** Illustration d'un widget vide (`drawable/widget_empty_*`) : icône sur un disque de couleur claire. */
enum class MessageIllustration(@DrawableRes val drawable: Int) {
    ACCOUNT(R.drawable.widget_empty_account),
    CAR(R.drawable.widget_empty_car),
    ERROR(R.drawable.widget_empty_error),
}

/**
 * Widget vide (pas connecté, aucune voiture, erreur serveur) : illustration et message. Centrés l'un sous l'autre,
 * côte à côte sur la barre 4x1. Le toucher ouvre l'app.
 */
@Composable
fun WidgetMessage(text: String, illustration: MessageIllustration = MessageIllustration.ERROR) {
    val bar = LocalSize.current.height < CarStatusWidget.SQUARE.height
    val image = @Composable { size: Dp ->
        Image(provider = ImageProvider(illustration.drawable), contentDescription = null, modifier = GlanceModifier.size(size))
    }
    if (bar) {
        Row(modifier = GlanceModifier.widgetContainer().padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            image(34.dp)
            Spacer(GlanceModifier.width(12.dp))
            Text(
                text = text,
                style = TextStyle(color = WidgetColors.primary, fontSize = 13.sp, fontWeight = FontWeight.Medium),
                maxLines = 2,
                modifier = GlanceModifier.defaultWeight(),
            )
        }
    } else {
        Column(
            modifier = GlanceModifier.widgetContainer().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            image(56.dp)
            Spacer(GlanceModifier.height(12.dp))
            Text(
                text = text,
                style = TextStyle(color = WidgetColors.primary, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center),
                maxLines = 3,
            )
        }
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
 * Bouton de confort thermique : pastille ronde avec l'icône seule, plus petite en [compact] (barre 4x1, carré 2x2,
 * widgets Tempo). Son retour recouvre tout le widget ([HvacFeedbackView]).
 */
@Composable
fun HvacButton(vin: String, compact: Boolean = false) {
    val size = if (compact) 26.dp else 30.dp
    Box(
        modifier = GlanceModifier.size(size).background(WidgetColors.track).cornerRadius(size / 2)
            .clickable(actionRunCallback<LaunchHvacAction>(actionParametersOf(LaunchHvacAction.VIN to vin))),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            provider = ImageProvider(R.drawable.ic_hvac_24),
            contentDescription = LocalContext.current.getString(R.string.widget_launch_pre_heat),
            modifier = GlanceModifier.size(if (compact) 14.dp else 16.dp),
            colorFilter = ColorFilter.tint(WidgetColors.primary),
        )
    }
}

/**
 * Retour du bouton de confort thermique, à la taille du widget :
 * - envoi en cours : indicateur de chargement ;
 * - réussite : coche verte et OK ;
 * - erreur : croix rouge et OK.
 * Sur une ligne pour la barre 4x1, centré sinon. Sans OK, il disparaît après [WidgetHvacFeedback.DISPLAY_DURATION_MS].
 */
@Composable
fun HvacFeedbackView(vin: String, feedback: WidgetHvacFeedback) {
    val context = LocalContext.current
    val size = LocalSize.current
    val bar = size.height < CarStatusWidget.SQUARE.height
    val (text, colour) = when (feedback.status) {
        Status.SENDING -> context.getString(R.string.widget_pre_heat_sending) to WidgetColors.primary
        Status.SUCCESS -> context.getString(R.string.widget_pre_heat_launched) to WidgetColors.charging
        Status.ERROR -> context.getString(R.string.widget_pre_heat_error) to WidgetColors.error
    }
    val iconSize = if (bar) 22.dp else 36.dp
    val icon = @Composable {
        if (feedback.status == Status.SENDING) {
            CircularProgressIndicator(modifier = GlanceModifier.size(iconSize), color = WidgetColors.primary)
        } else {
            Image(
                provider = ImageProvider(if (feedback.status == Status.SUCCESS) R.drawable.ic_check_24 else R.drawable.ic_close_24),
                contentDescription = null,
                modifier = GlanceModifier.size(iconSize),
                colorFilter = ColorFilter.tint(colour),
            )
        }
    }
    val label = @Composable { modifier: GlanceModifier ->
        Text(
            text = text,
            style = TextStyle(color = WidgetColors.primary, fontSize = if (bar) 14.sp else 15.sp, fontWeight = FontWeight.Medium, textAlign = if (bar) TextAlign.Start else TextAlign.Center),
            maxLines = 2,
            modifier = modifier,
        )
    }
    val buttons = @Composable {
        if (feedback.status != Status.SENDING) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                FeedbackButton(context.getString(R.string.widget_ok), actionRunCallback<DismissHvacFeedbackAction>(actionParametersOf(LaunchHvacAction.VIN to vin)))
            }
        }
    }

    if (bar) {
        Row(modifier = GlanceModifier.widgetContainer(vin).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            icon()
            Spacer(GlanceModifier.width(10.dp))
            label(GlanceModifier.defaultWeight())
            buttons()
        }
    } else {
        Column(
            modifier = GlanceModifier.widgetContainer(vin).padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            icon()
            Spacer(GlanceModifier.height(8.dp))
            label(GlanceModifier.fillMaxWidth())
            if (feedback.status != Status.SENDING) {
                Spacer(GlanceModifier.height(10.dp))
                buttons()
            }
        }
    }
}

/** Bouton texte du retour (OK). */
@Composable
private fun FeedbackButton(text: String, action: Action) {
    Box(
        modifier = GlanceModifier.height(30.dp).background(WidgetColors.track).cornerRadius(15.dp)
            .padding(horizontal = 14.dp).clickable(action),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = text, style = TextStyle(color = WidgetColors.primary, fontSize = 13.sp, fontWeight = FontWeight.Medium), maxLines = 1)
    }
}
