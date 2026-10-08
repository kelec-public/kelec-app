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
        val jwt = jwt()
        logger("JWT token fetch and decode OK.")
        val battery = request("Unable to get battery status") {
            RenaultServices.kamereon.getBatteryStatus(kamereonAccountId, vin, jwt, keys.kamereonApiKey).data?.attributes
        }
        logger("battery status ok.")
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

    /** Lance le confort thermique. false si la commande n'a pas été acceptée (même règle que l'app RN). */
    suspend fun launchHvac(vin: String, temperature: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val jwt = jwt()
            val response = RenaultServices.kamereon.startHvac(
                kamereonAccountId, vin, jwt, keys.kamereonApiKey, HvacStartRequest.start(temperature)
            )
            response.data?.type == "HvacStart" && response.data.id != null
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            logger("ERROR : Unable to launch HVAC (${e.javaClass.simpleName}: ${e.message})")
            false
        }
    }

    /** @throws RenaultApiException si la position ne peut pas être obtenue. */
    suspend fun fetchLocation(vin: String): CarLocation = withContext(Dispatchers.IO) {
        val jwt = jwt()
        request("Unable to get car location") {
            RenaultServices.kamereon.getLocation(kamereonAccountId, vin, jwt, keys.kamereonApiKey).data?.attributes
                ?.takeIf { it.gpsLatitude != null && it.gpsLongitude != null }
        }
    }

    private suspend fun jwt(): String = request("Unable to get login token") {
        RenaultServices.gigya.getJWT(loginToken = cookieValue, apiKey = keys.gigyaApiKey).idToken
    }

    private inline fun <T : Any> request(errorMessage: String, block: () -> T?): T {
        val result = try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            logger("ERROR : $errorMessage (${e.javaClass.simpleName}: ${e.message})")
            throw RenaultApiException(errorMessage, e)
        }
        if (result == null) {
            logger("ERROR : $errorMessage (empty response)")
            throw RenaultApiException(errorMessage)
        }
        return result
    }
}
