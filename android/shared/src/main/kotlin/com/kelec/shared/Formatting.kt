package com.kelec.shared

import android.content.Context
import android.text.format.DateFormat
import com.kelec.carapi.ChargingState
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Date
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

    /** Time of the last refresh, preceded by the date ("07/10 14:05", "7.10. 14:05"...) when it is not today. */
    fun lastRefresh(context: Context, dateTime: ZonedDateTime, today: LocalDate = LocalDate.now()): String {
        val local = dateTime.withZoneSameInstant(ZoneId.systemDefault())
        return if (local.toLocalDate() == today) localTime(local)
        else "${dayMonth(context, local.toLocalDate())} ${localTime(local)}"
    }

    /** Day and month, without the year, in the locale's order and separators: "08/10" (fr), "8.10." (de), "10/8" (en-US). */
    fun dayMonth(context: Context, date: LocalDate): String =
        localized(context, "Md", date.atStartOfDay(ZoneId.systemDefault()))

    /**
     * Formats a date or time the way the displayed language writes it.
     * The skeleton only lists the fields to show ("Md" = month and day);
     * Android picks their order and separators for the locale ("d.M." in German, "M/d" in US English, ...).
     */
    private fun localized(context: Context, skeleton: String, dateTime: ZonedDateTime): String {
        val locale = context.resources.configuration.locales[0]
        val pattern = DateFormat.getBestDateTimePattern(locale, skeleton)
        return SimpleDateFormat(pattern, locale).format(Date.from(dateTime.toInstant()))
    }

    /** Prix Tempo : « 16.12 c/kWh » */
    fun tempoPrice(cents: Double): String = String.format(Locale.ROOT, "%.2f c/kWh", cents)

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
