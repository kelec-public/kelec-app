package com.kelec.shared

import android.content.Context
import com.kelec.carapi.BatteryStatus
import com.kelec.carapi.RenaultApiClient
import com.kelec.carapi.RenaultApiKeys
import kotlin.coroutines.cancellation.CancellationException

sealed interface VehicleStatus {
    data class Loaded(val battery: BatteryStatus, val fromCache: Boolean) : VehicleStatus
    /** Pas de session Renault enregistrée : il faut se connecter dans l'app. */
    data object NotLoggedIn : VehicleStatus
    /** Échec du chargement et rien en cache. */
    data object Unavailable : VehicleStatus
}

/**
 * Charge le statut d'une voiture : requête, enregistrement (cache et historique de l'app RN),
 * et retour au cache en cas d'échec. Seuls Renault group et la démo sont gérés (Hyundai hors périmètre).
 */
class VehicleLoader(context: Context, private val keys: RenaultApiKeys) {
    private val secureStore = SecureStore(context)
    private val history = SharedHistory(context)

    suspend fun load(car: UserCar): VehicleStatus {
        if (car.maker == CarMaker.DEMO) return VehicleStatus.Loaded(BatteryStatus.demo(), fromCache = false)

        val cookieValue = secureStore.renaultCookieValue(car.email)
        if (cookieValue == null) {
            history.writeWidgetLog("No Renault session for ${car.model}")
            return VehicleStatus.NotLoggedIn
        }

        val client = RenaultApiClient(car.kamereonAccountId, cookieValue, keys, history::writeWidgetLog)
        return try {
            val status = client.fetchStatus(car.vin)
            history.saveBatteryStatus(car.vin, status.battery)
            status.totalMileage?.let { history.saveMileage(car.vin, it) }
            history.writeWidgetLog("Data successfully fetched for ${car.model}")
            VehicleStatus.Loaded(status.battery, fromCache = false)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            history.writeWidgetLog("Loading cache data for ${car.model}: ${e.message}")
            history.loadBatteryStatus(car.vin)
                ?.let { VehicleStatus.Loaded(it, fromCache = true) }
                ?: VehicleStatus.Unavailable
        }
    }
}
