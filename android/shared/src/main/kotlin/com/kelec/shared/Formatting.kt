package com.kelec.shared

import android.content.Context
import com.kelec.carapi.ChargingState
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

object Formatting {
    private const val KM_TO_MILES = 0.621371

    fun parseTimestamp(timestamp: String?): ZonedDateTime? = try {
        timestamp?.let { ZonedDateTime.parse(it, DateTimeFormatter.ISO_DATE_TIME) }
    } catch (e: Exception) {
        null
    }

    /** « 14:05 » dans le fuseau du téléphone. */
    fun localTime(dateTime: ZonedDateTime): String =
        dateTime.withZoneSameInstant(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT))

    /** « 2h05 » */
    fun duration(minutes: Int): String = String.format(Locale.ROOT, "%dh%02d", minutes / 60, minutes % 60)

    /** « 300 km », « 186 mi » selon les préférences (conversion et unité sont deux réglages distincts). */
    fun range(km: Int, prefs: AppPreferences): String {
        val value = if (prefs.convertToMiles) (km * KM_TO_MILES).toInt() else km
        return "$value ${if (prefs.displayMiles) "mi" else "km"}"
    }
}

/** Libellé affiché devant l'autonomie (« EN CHARGE | »). */
fun ChargingState.label(context: Context): String = when (this) {
    ChargingState.SCHEDULED -> context.getString(R.string.scheduled_charge_status)
    ChargingState.ENDED -> context.getString(R.string.ended_charge_status)
    ChargingState.CHARGING, ChargingState.CHARGING_LEGACY_ZOE -> context.getString(R.string.charging_status)
    ChargingState.V2G -> "V2G"
    ChargingState.V2L -> "V2L"
    ChargingState.NOT_CHARGING -> context.getString(R.string.not_charging_status)
}
