package com.kelec.wear.complication

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationText
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.LongTextComplicationData
import androidx.wear.watchface.complications.data.MonochromaticImage
import androidx.wear.watchface.complications.data.NoDataComplicationData
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.RangedValueComplicationData
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import com.kelec.carapi.BatteryStatus
import com.kelec.shared.AppPreferences
import com.kelec.shared.Formatting
import com.kelec.shared.SharedStore
import com.kelec.shared.VehicleStatus
import com.kelec.wear.MainActivity
import com.kelec.wear.R
import com.kelec.wear.vehicleLoader
import com.kelec.wear.watchCar

/**
 * Complications du cadran (pendant des widgets de l'Apple Watch) : niveau de batterie de la voiture choisie
 * dans les Réglages de l'app de la montre, sinon la première.
 * - RANGED_VALUE : jauge circulaire (comme `accessoryCircular`) ;
 * - SHORT_TEXT : « 80% » et l'autonomie (comme `accessoryCorner` / `accessoryInline`) ;
 * - LONG_TEXT : « Zoé · 80% · 245 km » (comme `accessoryRectangular`).
 * Rechargée toutes les 15 min (UPDATE_PERIOD_SECONDS), après une synchro et après le choix de la voiture.
 */
class BatteryComplicationService : SuspendingComplicationDataSourceService() {

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData {
        val store = SharedStore(this)
        val type = request.complicationType
        // pas de compte, pas de voiture ou pas de statut : « -- », et le toucher ouvre l'app (pour synchroniser)
        val account = store.loadAccount() ?: return unavailable(type)
        val car = watchCar(account, store) ?: return unavailable(type)
        val battery = (vehicleLoader(this).load(car) as? VehicleStatus.Loaded)?.battery ?: return unavailable(type)
        return build(type, car.model, battery, store.loadPreferences() ?: AppPreferences()) ?: NoDataComplicationData()
    }

    private fun unavailable(type: ComplicationType): ComplicationData {
        val dashes = text("--")
        val icon = MonochromaticImage.Builder(Icon.createWithResource(this, R.drawable.ic_car)).build()
        return when (type) {
            ComplicationType.RANGED_VALUE -> RangedValueComplicationData.Builder(0f, 0f, 100f, dashes)
                .setText(dashes)
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(dashes, dashes)
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            ComplicationType.LONG_TEXT -> LongTextComplicationData.Builder(dashes, dashes)
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            else -> NoDataComplicationData()
        }
    }

    override fun getPreviewData(type: ComplicationType): ComplicationData? =
        build(type, "Zoé", BatteryStatus.demo(), AppPreferences())

    private fun build(type: ComplicationType, carName: String, battery: BatteryStatus, prefs: AppPreferences): ComplicationData? {
        val level = battery.batteryLevel ?: 0
        val levelText = text("$level%")
        val range = Formatting.range(battery.batteryAutonomy ?: 0, prefs)
        val description = text("$carName $level% $range")
        val icon = MonochromaticImage.Builder(
            Icon.createWithResource(this, if (battery.isPlugged) R.drawable.ic_bolt_24 else R.drawable.ic_car)
        ).build()

        return when (type) {
            ComplicationType.RANGED_VALUE -> RangedValueComplicationData.Builder(level.toFloat(), 0f, 100f, description)
                .setText(levelText)
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(levelText, description)
                .setTitle(text(range))
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            ComplicationType.LONG_TEXT -> LongTextComplicationData.Builder(text("$level% · $range"), description)
                .setTitle(text(carName))
                .setMonochromaticImage(icon)
                .setTapAction(openApp())
                .build()
            else -> null
        }
    }

    /** Toucher la complication ouvre l'app de la montre (comme les widgets de l'Apple Watch). */
    private fun openApp(): PendingIntent = PendingIntent.getActivity(
        this,
        0,
        Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    private fun text(value: String): ComplicationText = PlainComplicationText.Builder(value).build()

    companion object {
        /** Recharge toutes les complications (synchro, choix de la voiture, rafraîchissement dans l'app). */
        fun requestUpdate(context: Context) {
            ComplicationDataSourceUpdateRequester
                .create(context, ComponentName(context, BatteryComplicationService::class.java))
                .requestUpdateAll()
        }
    }
}
