package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.Context
import com.kelec.ApiKeys
import com.kelec.shared.SharedHistory
import com.kelec.shared.SharedStore
import com.kelec.shared.VehicleLoader
import com.kelec.shared.VehicleStatus
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import com.kelec.shared.R as SharedR

/** Charge et affiche les widgets : une seule requête par voiture, même si plusieurs widgets l'affichent. */
object WidgetUpdater {

    suspend fun update(context: Context, appWidgetIds: IntArray) {
        if (appWidgetIds.isEmpty()) return
        val manager = AppWidgetManager.getInstance(context)
        val store = SharedStore(context)

        val account = store.loadAccount()
        if (account == null || account.cars.isEmpty()) {
            val message = if (account == null) SharedR.string.not_yet_logged_in else SharedR.string.no_car_added
            SharedHistory(context).writeWidgetLog("Widget: no account or no car")
            val views = KelecWidgetViews.error(context, context.getString(message))
            appWidgetIds.forEach { manager.updateAppWidget(it, views) }
            return
        }

        val carByWidget = appWidgetIds.mapNotNull { id -> account.carFor(store.widgetVin(id))?.let { id to it } }.toMap()
        val loader = VehicleLoader(context, ApiKeys.renault)
        val statusByVin = coroutineScope {
            carByWidget.values.distinctBy { it.vin }
                .map { car -> async { car.vin to loader.load(car) } }
                .awaitAll()
                .toMap()
        }

        val prefs = store.loadPreferences()
        for ((appWidgetId, car) in carByWidget) {
            val views = when (val status = statusByVin[car.vin]) {
                is VehicleStatus.Loaded -> KelecWidgetViews.main(context, appWidgetId, status.battery, car, prefs)
                VehicleStatus.NotLoggedIn -> KelecWidgetViews.error(context, context.getString(SharedR.string.not_yet_logged_in))
                VehicleStatus.Unavailable, null -> KelecWidgetViews.error(context, context.getString(SharedR.string.widget_server_error))
            }
            manager.updateAppWidget(appWidgetId, views)
        }
    }
}
