package com.kelec.widgets

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.kelec.KelecMainWIdget
import com.kelec.MainActivity
import com.kelec.R
import com.kelec.carapi.BatteryStatus
import com.kelec.shared.AppPreferences
import com.kelec.shared.CarMaker
import com.kelec.shared.Formatting
import com.kelec.shared.UserCar
import com.kelec.shared.label
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

object KelecWidgetViews {

    fun error(context: Context, message: String): RemoteViews =
        RemoteViews(context.packageName, R.layout.kelec_center_text_widget).apply {
            setTextViewText(R.id.center_text, message)
        }

    fun main(
        context: Context,
        appWidgetId: Int,
        battery: BatteryStatus,
        car: UserCar,
        prefs: AppPreferences,
    ): RemoteViews = RemoteViews(context.packageName, R.layout.kelec_main_w_idget).apply {
        setImageViewResource(R.id.car_manufacturer_logo, logoFor(car.maker))
        setTextViewText(R.id.car_name, car.model)

        val lastRefresh = Formatting.parseTimestamp(battery.timestamp)
        lastRefresh?.let { setTextViewText(R.id.last_update_button, Formatting.localTime(it)) }

        val state = battery.chargingState
        val plugged = battery.isPlugged
        setTextViewText(R.id.charging_status_text, if (plugged) state.label(context) else "")

        bindMainAppIntent(context, this)
        bindRefreshIntent(context, this, appWidgetId)
        bindProgress(this, battery.batteryLevel ?: 0, plugged)

        if (plugged) {
            bindChargingTimes(this, battery, lastRefresh)
        } else {
            setViewVisibility(R.id.charging_texts, View.GONE)
        }

        setTextViewText(R.id.battery_level_text, (battery.batteryLevel ?: 0).toString())
        setTextViewText(R.id.battery_autonomy_text, Formatting.range(battery.batteryAutonomy ?: 0, prefs))
    }

    private fun logoFor(maker: CarMaker): Int = when (maker) {
        CarMaker.ALPINE -> R.drawable.alpine_logo
        CarMaker.DACIA -> R.drawable.dacia_logo
        else -> R.drawable.renault_logo
    }

    // ouvre l'app au toucher du widget
    private fun bindMainAppIntent(context: Context, views: RemoteViews) {
        val intent = Intent(context, MainActivity::class.java)
        val pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        views.setOnClickPendingIntent(R.id.main_widget_content, pi)
    }

    // le bouton de l'heure de mise à jour recharge les données
    private fun bindRefreshIntent(context: Context, views: RemoteViews, appWidgetId: Int) {
        val intent = Intent(context, KelecMainWIdget::class.java).setAction(KelecMainWIdget.REFRESH_WIDGET_ACTION)
        val pi = PendingIntent.getBroadcast(
            context, appWidgetId, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(R.id.last_update_button, pi)
    }

    private fun bindProgress(views: RemoteViews, level: Int, plugged: Boolean) {
        val (shown, hidden) = if (plugged) {
            R.id.charging_progress_bar to R.id.not_charging_progress_bar
        } else {
            R.id.not_charging_progress_bar to R.id.charging_progress_bar
        }
        views.setViewVisibility(hidden, View.GONE)
        views.setViewVisibility(shown, View.VISIBLE)
        views.setProgressBar(shown, 100, level, false)
    }

    private fun bindChargingTimes(views: RemoteViews, battery: BatteryStatus, lastRefresh: ZonedDateTime?) {
        val level = battery.batteryLevel ?: 0
        val remaining = battery.chargingRemainingTime ?: 0

        if (battery.chargingState.isActivelyCharging(level) && lastRefresh != null) {
            views.setViewVisibility(R.id.end_time_image, View.VISIBLE)
            views.setViewVisibility(R.id.end_time_text, View.VISIBLE)
            views.setTextViewText(
                R.id.end_time_text,
                Formatting.localTime(lastRefresh.plus(remaining.toLong(), ChronoUnit.MINUTES))
            )
            views.setTextViewText(R.id.time_remaining_text, Formatting.duration(remaining))
        } else {
            views.setViewVisibility(R.id.end_time_image, View.GONE)
            views.setViewVisibility(R.id.end_time_text, View.GONE)
            views.setTextViewText(R.id.time_remaining_text, "--h--")
        }
    }
}
