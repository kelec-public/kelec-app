package com.kelec.bridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.kelec.shared.WearSyncContract

/**
 * Synchro avec la montre Wear OS (Réglages → « Synchroniser avec la montre »), pendant Android de
 * `updateApplicationContext` : un seul DataItem ([WearSyncContract.PATH]), livré même si l'app de la montre est fermée.
 * Appelé par `sendDataToAppleWatch` (src/lib/storage/sharedPlatformsData.tsx).
 */
class WearSync(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WearSync"

    @ReactMethod
    fun sync(account: String, appPreferences: String, cookieValues: String, passwords: String, promise: Promise) {
        val request = PutDataMapRequest.create(WearSyncContract.PATH).apply {
            dataMap.putString(WearSyncContract.ACCOUNT, account)
            dataMap.putString(WearSyncContract.APP_PREFERENCES, appPreferences)
            dataMap.putString(WearSyncContract.COOKIE_VALUES, cookieValues)
            dataMap.putString(WearSyncContract.PASSWORDS, passwords)
            dataMap.putLong(WearSyncContract.TIMESTAMP, System.currentTimeMillis())
        }.asPutDataRequest().setUrgent()

        Wearable.getDataClient(reactApplicationContext).putDataItem(request)
            .addOnSuccessListener { promise.resolve(null) }
            .addOnFailureListener { promise.reject("WEAR_SYNC_ERROR", it) }
    }
}
