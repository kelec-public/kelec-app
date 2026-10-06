package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.Context
import com.kelec.ApiKeys
import com.kelec.shared.AppPreferences
import com.kelec.shared.SharedHistory
import com.kelec.shared.SharedStore
import com.kelec.shared.UserAccount
import com.kelec.shared.UserCar
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
        val history = SharedHistory(context)
        history.writeWidgetLog("Refreshing ${appWidgetIds.size} widget(s)")

        val prefs = store.loadPreferences()
        history.writeWidgetLog(
            if (prefs == null) "APP PREFERENCES NOT FOUND OR COULDN'T BE DECODED" else "APP PREFERENCES FOUND AND DECODED"
        )

        val account = store.loadAccount()
        if (account == null || account.cars.isEmpty()) {
            val message = if (account == null) SharedR.string.not_yet_logged_in else SharedR.string.no_car_added
            history.writeWidgetLog(if (account == null) "No account: user not logged in" else "No car in the account")
            val views = KelecWidgetViews.error(context, context.getString(message))
            appWidgetIds.forEach { manager.updateAppWidget(it, views) }
            return
        }

        val carByWidget = appWidgetIds.mapNotNull { id -> widgetCar(account, store.widgetVin(id), history)?.let { id to it } }.toMap()
        val loader = VehicleLoader(context, ApiKeys.renault)
        val statusByVin = coroutineScope {
            carByWidget.values.distinctBy { it.vin }
                .map { car -> async { car.vin to loader.load(car) } }
                .awaitAll()
                .toMap()
        }

        for ((appWidgetId, car) in carByWidget) {
            val views = when (val status = statusByVin[car.vin]) {
                is VehicleStatus.Loaded -> KelecWidgetViews.main(context, appWidgetId, status.battery, car, prefs ?: AppPreferences())
                VehicleStatus.NotLoggedIn -> KelecWidgetViews.error(context, context.getString(SharedR.string.not_yet_logged_in))
                VehicleStatus.Unavailable, null -> KelecWidgetViews.error(context, context.getString(SharedR.string.widget_server_error))
            }
            manager.updateAppWidget(appWidgetId, views)
        }
    }

    /** La voiture configurée sur le widget, sinon la première (même règle et mêmes logs que les widgets iOS). */
    private fun widgetCar(account: UserAccount, configuredVin: String?, history: SharedHistory): UserCar? {
        if (configuredVin == null) {
            history.writeWidgetLog("No car configured, using first available car")
            return account.carFor(null)
        }
        if (account.cars.none { it.vin == configuredVin }) {
            history.writeWidgetLog("Configured car not found (vin: $configuredVin), falling back to first car")
        }
        return account.carFor(configuredVin)
    }
}
