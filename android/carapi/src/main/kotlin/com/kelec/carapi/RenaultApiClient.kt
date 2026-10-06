package com.kelec.carapi

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.coroutines.cancellation.CancellationException

class RenaultApiException(message: String, cause: Throwable? = null) : Exception(message, cause)

/** Ce que renvoie un chargement : le kilométrage est facultatif (son échec ne fait pas perdre la batterie). */
data class RenaultVehicleStatus(
    val battery: BatteryStatus,
    val totalMileage: Double?,
)

/**
 * Client Renault group (Renault, Dacia, Alpine) : n'utilise que le cookie de session (`login_token`),
 * jamais le mot de passe. N'écrit rien : l'appelant enregistre ce qu'il veut garder.
 */
class RenaultApiClient(
    private val kamereonAccountId: String,
    private val cookieValue: String,
    private val keys: RenaultApiKeys,
    private val logger: (String) -> Unit = {},
) {
    /** @throws RenaultApiException si le jeton ou le statut batterie ne peut pas être obtenu. */
    suspend fun fetchStatus(vin: String): RenaultVehicleStatus = withContext(Dispatchers.IO) {
        val jwt = request("Unable to get login token") {
            RenaultServices.gigya.getJWT(loginToken = cookieValue, apiKey = keys.gigyaApiKey).idToken
        }
        val battery = request("Unable to get battery status") {
            RenaultServices.kamereon.getBatteryStatus(kamereonAccountId, vin, jwt, keys.kamereonApiKey).data?.attributes
        }
        val totalMileage = try {
            RenaultServices.kamereon.getCockpit(kamereonAccountId, vin, jwt, keys.kamereonApiKey).data?.attributes?.totalMileage
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            logger("Unable to get mileage: ${e.message}")
            null
        }
        RenaultVehicleStatus(battery, totalMileage)
    }

    private inline fun <T : Any> request(errorMessage: String, block: () -> T?): T {
        val result = try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            throw RenaultApiException(errorMessage, e)
        }
        return result ?: throw RenaultApiException(errorMessage)
    }
}
