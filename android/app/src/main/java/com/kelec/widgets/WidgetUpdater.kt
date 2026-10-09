package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.kelec.ApiKeys
import com.kelec.KelecMainWIdget
import com.kelec.shared.SharedHistory
import com.kelec.shared.SharedStore
import com.kelec.shared.TempoLoader
import com.kelec.shared.UserAccount
import com.kelec.shared.UserCar
import com.kelec.shared.VehicleLoader
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope

/**
 * Redessine tous les widgets avec le cache, charge leurs données, puis les redessine (Glance relit le cache,
 * voir [WidgetData] et [WidgetRedraw]).
 * Une seule requête par voiture, même si plusieurs widgets l'affichent ; Tempo n'est chargé que s'il y a
 * un widget Tempo qui affiche une voiture (comme sur iOS).
 */
object WidgetUpdater {

    suspend fun update(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val carWidgetIds = idsOf(context, manager, KelecMainWIdget::class.java)
        val tempoWidgetIds = idsOf(context, manager, KelecTempoWidgetReceiver::class.java) +
            idsOf(context, manager, KelecTempo2DaysWidgetReceiver::class.java)
        val allIds = carWidgetIds + tempoWidgetIds
        if (allIds.isEmpty()) return

        val store = SharedStore(context)
        val history = SharedHistory(context)
        history.writeWidgetLog("Refreshing ${allIds.size} widget(s)")
        history.writeWidgetLog(
            if (store.loadPreferences() == null) "APP PREFERENCES NOT FOUND OR COULDN'T BE DECODED" else "APP PREFERENCES FOUND AND DECODED"
        )

        // d'abord avec le cache : la voiture choisie à la pose s'affiche sans attendre le réseau
        redraw(context, manager, carWidgetIds)

        val account = store.loadAccount()
        if (account == null || account.cars.isEmpty()) {
            history.writeWidgetLog(if (account == null) "No account: user not logged in" else "No car in the account")
        } else {
            val cars = allIds.toList().mapNotNull { id -> widgetCar(account, store.widgetVin(id), history) }.distinctBy { it.vin }
            val loader = VehicleLoader(context, ApiKeys.renault)
            coroutineScope {
                val carsLoading = cars.map { car -> async { loader.load(car) } }
                val tempoLoading = if (tempoWidgetIds.isNotEmpty()) async { TempoLoader(context, ApiKeys.rteBasicAuth).load() } else null
                carsLoading.awaitAll()
                tempoLoading?.await()
            }
        }

        redraw(context, manager, carWidgetIds)
    }

    private suspend fun redraw(context: Context, manager: AppWidgetManager, carWidgetIds: IntArray) {
        if (carWidgetIds.isNotEmpty()) WidgetRedraw.all(context, CarStatusWidget())
        if (idsOf(context, manager, KelecTempoWidgetReceiver::class.java).isNotEmpty()) WidgetRedraw.all(context, TempoWidget())
        if (idsOf(context, manager, KelecTempo2DaysWidgetReceiver::class.java).isNotEmpty()) WidgetRedraw.all(context, Tempo2DaysWidget())
    }

    fun idsOf(context: Context, manager: AppWidgetManager, receiver: Class<*>): IntArray =
        manager.getAppWidgetIds(ComponentName(context, receiver))

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
