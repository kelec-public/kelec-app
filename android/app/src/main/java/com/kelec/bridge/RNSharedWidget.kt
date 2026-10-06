package com.kelec.bridge

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.kelec.KelecMainWIdget
import com.kelec.shared.SecureStore
import com.kelec.shared.SharedStore

/**
 * Bridge RN du stockage partagé avec le widget. Même nom et mêmes méthodes que le module iOS
 * (ios/Kelec/RNSharedWidget.swift) : côté JS, tout passe par src/lib/storage/sharedPlatformsData.tsx.
 */
class RNSharedWidget(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val sharedStore = SharedStore(reactContext)
    private val secureStore = SecureStore(reactContext)
    private val handler = Handler(Looper.getMainLooper())
    private val reloadWidgets = Runnable { KelecMainWIdget.requestUpdate(reactApplicationContext) }

    init {
        sharedStore.removeLegacyCarImages()
    }

    override fun getName() = "RNSharedWidget"

    /** Une série d'écritures (compte, préférences) ne recharge le widget qu'une fois, après 0,5 s. */
    @ReactMethod
    fun setData(key: String, value: String, promise: Promise) {
        sharedStore.putString(key, value)
        handler.removeCallbacks(reloadWidgets)
        handler.postDelayed(reloadWidgets, RELOAD_DELAY_MS)
        promise.resolve(null)
    }

    /** null si la clé n'existe pas. */
    @ReactMethod
    fun getData(key: String, promise: Promise) {
        promise.resolve(sharedStore.getString(key))
    }

    @ReactMethod
    fun setCryptedData(key: String, value: String, promise: Promise) {
        try {
            secureStore.set(key, value)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SET_ERROR", e.message, e)
        }
    }

    /** null si la clé est absente ou illisible. */
    @ReactMethod
    fun getCryptedData(key: String, promise: Promise) {
        promise.resolve(secureStore.get(key))
    }

    @ReactMethod
    fun clearCryptedData(key: String, promise: Promise) {
        try {
            secureStore.remove(key)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CLEAR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun refreshWidgets(promise: Promise) {
        KelecMainWIdget.requestUpdate(reactApplicationContext)
        promise.resolve(null)
    }

    private companion object {
        const val RELOAD_DELAY_MS = 500L
    }
}
