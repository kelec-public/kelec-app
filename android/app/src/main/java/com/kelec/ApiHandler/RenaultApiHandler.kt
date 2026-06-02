package com.kelec.ApiHandler

import android.content.Context
import android.util.Log
import com.kelec.batteryStatusHandler.BatteryStatusHandler
import com.kelec.mileageHistory.MileageHandler
import com.kelec.oidc.OidcTokens
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.CompletableFuture

class RenaultApiHandler(
    private val email: String,
    private val oidcTokens: OidcTokens,
    private val kamereonAccountID: String,
) {
    private var debugMode: Boolean = true

    companion object {
        private const val TAG = "RenaultApiHandler"
    }

    private fun logDebug(msg: String){
        if (debugMode) Log.d(TAG, msg);
    }

    private suspend fun getBatteryStatusInternal(context: Context, vin: String): BatteryStatusAttributes? =
        withContext(Dispatchers.IO){
                logDebug("Fetching battery status...")
                val batteryStatus: BatteryStatusAttributes
                try {
                    val batteryResponse = KamereonApiClient.apiService.getBatteryStatus(
                        kamereonAccountID, vin, oidcTokens.accessToken
                    )
                    batteryStatus = batteryResponse.data.attributes!!
                    BatteryStatusHandler.saveBatteryStatus(context, vin, batteryStatus)
                } catch (e: Exception) {
                    throw RuntimeException("Unable to get battery status")
                }


                logDebug("Fetching cockpit status...")
                val cockpitResponse = KamereonCockpitApiClient.apiService.getCockpitStatus(
                    kamereonAccountID, vin, oidcTokens.accessToken
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