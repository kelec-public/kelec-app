package com.kelec.widgets

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.kelec.ApiHandler.AppPreferences
import com.kelec.ApiHandler.BatteryStatusAttributes
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Locale
import com.kelec.MainActivity
import com.kelec.KelecMainWIdget
import com.kelec.R


object KelecWidgetViews {
    private const val TAG = "KelecWidgetViews"
    private const val PLUG_STATUS_PLUGGED = 1
    private const val KM_TO_MILES_FACTOR = 0.621371

    fun error(context: Context, message: String): RemoteViews = RemoteViews(
        context.packageName, R.layout.kelec_center_text_widget).apply {
            setTextViewText(R.id.center_text, message)
    }

    fun main(
         context: Context,
         appWidgetId: Int,
         battery: BatteryStatusAttributes,
         carName: String,
         carMaker: String,
         prefs: AppPreferences?
    ): RemoteViews = RemoteViews(context.packageName, R.layout.kelec_main_w_idget).apply {

        // first apply the car maker logo
        setImageViewResource(R.id.car_manufacturer_logo, logoFor(carMaker))
        setTextViewText(R.id.car_name, carName)

        val lastRefresh = battery.timestamp?.let { parseTimestamp(it) }
        lastRefresh?.let { setTextViewText(R.id.last_update_button, formatLocalTime(it)) }

        val state = ChargingState.fromRawStatus(battery.chargingStatus ?: 0.0)
        val plugged = battery.plugStatus == PLUG_STATUS_PLUGGED
        setTextViewText(R.id.charging_status_text, if (plugged) state.label(context) else "")


        bindMainAppIntent(context, this)
        bindRefreshIntent(context, this, appWidgetId)
        bindProgress(this, battery, plugged)

        if (plugged) {
            bindChargingTimes(this, battery, state, lastRefresh)
        } else {
            setViewVisibility(R.id.charging_texts, View.GONE)
        }

        setTextViewText(R.id.battery_level_text, (battery.batteryLevel ?: 0).toString())
        setTextViewText(
            R.id.battery_autonomy_text,
            "${displayRange(battery.batteryAutonomy ?: 0, prefs)}${distanceUnits(prefs)}"
        )
    }


    // heplpers
    private fun logoFor(carMaker: String): Int = when (carMaker) {
        "alpine" -> R.drawable.alpine_logo
        "dacia" -> R.drawable.dacia_logo
        else -> R.drawable.renault_logo
    }

    // to open app when touching on widget
    private fun bindMainAppIntent(context: Context, views: RemoteViews) {
        val intent = Intent(context, MainActivity::class.java)
        val pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.main_widget_content, pi)
    }

    // to refresh car data
    private fun bindRefreshIntent(context: Context, views: RemoteViews, appWidgetId: Int) {
        val intent = Intent(context, KelecMainWIdget::class.java).setAction(KelecMainWIdget.REFRESH_WIDGET_ACTION)
        val pi = PendingIntent.getBroadcast(
            context, appWidgetId, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(R.id.last_update_button, pi)
    }

    private fun bindProgress(views: RemoteViews, battery: BatteryStatusAttributes, plugged: Boolean) {
        val level = battery.batteryLevel ?: 0
        if (plugged) {
            views.setViewVisibility(R.id.not_charging_progress_bar, View.GONE)
            views.setViewVisibility(R.id.charging_progress_bar, View.VISIBLE)
            views.setProgressBar(R.id.charging_progress_bar, 100, level, false)
        } else {
            views.setViewVisibility(R.id.charging_progress_bar, View.GONE)
            views.setViewVisibility(R.id.not_charging_progress_bar, View.VISIBLE)
            views.setProgressBar(R.id.not_charging_progress_bar, 100, level, false)
        }
    }

    private fun bindChargingTimes(
        views: RemoteViews,
        battery: BatteryStatusAttributes,
        state: ChargingState,
        lastRefresh: ZonedDateTime?
    ) {
        val level = battery.batteryLevel ?: 0
        val remaining = battery.chargingRemainingTime ?: 0

        if (state.isActivelyCharging(level) && lastRefresh != null) {
            views.setViewVisibility(R.id.end_time_image, View.VISIBLE)
            views.setViewVisibility(R.id.end_time_text, View.VISIBLE)
            views.setTextViewText(
                R.id.end_time_text,
                formatLocalTime(lastRefresh.plus(remaining.toLong(), ChronoUnit.MINUTES))
            )
            views.setTextViewText(
                R.id.time_remaining_text,
                String.format(Locale.getDefault(), "%dh%02d", remaining / 60, remaining % 60)
            )
        } else {
            views.setViewVisibility(R.id.end_time_image, View.GONE)
            views.setViewVisibility(R.id.end_time_text, View.GONE)
            views.setTextViewText(R.id.time_remaining_text, "--h--")
        }
    }

    private fun parseTimestamp(timestamp: String): ZonedDateTime? = try {
        ZonedDateTime.parse(timestamp, DateTimeFormatter.ISO_DATE_TIME)
    } catch (e: DateTimeParseException) {
        null
    }

    private fun formatLocalTime(dateTime: ZonedDateTime): String = dateTime.withZoneSameInstant(
        ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("HH:mm", Locale.ROOT))

    private fun displayRange(km: Int, prefs: AppPreferences?): Int = if (prefs?.convertToMiles == true) (km * KM_TO_MILES_FACTOR).toInt() else km

    private fun distanceUnits(prefs: AppPreferences?): String = if (prefs?.displayMiles == true) " mi" else " km"

}