package com.kelec.shared

import android.content.Context
import com.kelec.carapi.CarLocation
import com.kelec.carapi.RenaultApiClient
import com.kelec.carapi.RenaultApiKeys
import kotlin.coroutines.cancellation.CancellationException

/** Commandes et données à la demande (montre) : confort thermique et position. Renault group et démo seulement. */
class VehicleCommands(context: Context, private val keys: RenaultApiKeys) {
    private val secureStore = SecureStore(context)
    private val history = SharedHistory(context)

    /** false si la commande n'a pas pu être envoyée (pas de session, constructeur non géré, refus du serveur). */
    suspend fun launchHvac(car: UserCar, temperature: Int): Boolean {
        if (car.maker == CarMaker.DEMO) return true
        val client = renaultClient(car) ?: return false
        return client.launchHvac(car.vin, temperature)
    }

    /** null si la position ne peut pas être obtenue. */
    suspend fun location(car: UserCar): CarLocation? {
        if (car.maker == CarMaker.DEMO) return DEMO_LOCATION
        val client = renaultClient(car) ?: return null
        return try {
            client.fetchLocation(car.vin)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            null
        }
    }

    private fun renaultClient(car: UserCar): RenaultApiClient? {
        if (car.maker !in RENAULT_GROUP) return null
        val cookieValue = secureStore.renaultCookieValue(car.email) ?: return null
        return RenaultApiClient(car.kamereonAccountId, cookieValue, keys) { history.writeWidgetLog(it) }
    }

    private companion object {
        val RENAULT_GROUP = setOf(CarMaker.RENAULT, CarMaker.DACIA, CarMaker.ALPINE)
        /** Position de la voiture de démo (celle du package iOS). */
        val DEMO_LOCATION = CarLocation(48.854700, 2.347749)
    }
}
