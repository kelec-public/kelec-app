package com.kelec.ApiHandler

import android.content.Context
import android.util.Log
import com.kelec.batteryStatusHandler.BatteryStatusHandler
import com.kelec.mileageHistory.MileageHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.CompletableFuture

class RenaultApiHandler(
    private val email: String,
    private val password: String,
    private val kamereonAccountID: String,
    private val cookieValue: String,
) {


    private suspend fun getBatteryStatusInternal(context: Context, vin: String): BatteryStatusAttributes? =
        withContext(Dispatchers.IO){

                val jwt: String
                try {
                    val jwtResponse = GigyaApiClient.apiService.getJWTToken(cookieValue)
                    jwt = jwtResponse.id_token
                } catch (e: Exception) {
                    throw RuntimeException("Unable to get login token")
                }

                val batteryStatus: BatteryStatusAttributes
                try {
                    val batteryResponse = KamereonApiClient.apiService.getBatteryStatus(
                        kamereonAccountID, vin, jwt
                    )
                    batteryStatus = batteryResponse.data.attributes!!
                    BatteryStatusHandler.saveBatteryStatus(context, vin, batteryStatus)
                } catch (e: Exception) {
                    throw RuntimeException("Unable to get battery status")
                }

                val cockpitResponse = KamereonCockpitApiClient.apiService.getCockpitStatus(
                    kamereonAccountID, vin, jwt
                )
                cockpitResponse.data.attributes?.let {
                    if (it.totalMileage != null)
                        MileageHandler.saveMileageHistory(context, vin, it.totalMileage)
                }

                batteryStatus
        }

    public fun getBatteryStatus(context: Context, vin: String): CompletableFuture<BatteryStatusAttributes?> {
    val future = CompletableFuture<BatteryStatusAttributes?>()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = getBatteryStatusInternal(context, vin)
                if (result  == null){
                    future.completeExceptionally(Exception("Unable to get battery status"))
                } else {
                    future.complete(result)
                }
            } catch (e: RuntimeException) {
                future.completeExceptionally(e)
            }
        }
    return future
    }

}