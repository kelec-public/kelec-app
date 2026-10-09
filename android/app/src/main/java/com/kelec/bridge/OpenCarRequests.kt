package com.kelec.bridge

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Bridge RN (src/packages/kelec-car-shortcuts) : la voiture à afficher, demandée par un raccourci ou un widget.
 * Même nom et mêmes méthodes que le module iOS (ios/Kelec/OpenCarRequests.swift). La demande attend que l'app RN
 * la lise (elle n'est pas forcément démarrée), et un évènement la prévient qu'une demande est arrivée.
 */
class OpenCarRequests(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "OpenCarRequests"

    override fun initialize() {
        super.initialize()
        listener = { reactApplicationContext.emitDeviceEvent(EVENT) }
    }

    override fun invalidate() {
        listener = null
        super.invalidate()
    }

    /** Le VIN de la dernière demande, null s'il n'y en a pas ; une demande n'est lue qu'une fois. */
    @ReactMethod
    fun consume(promise: Promise) {
        promise.resolve(takePending())
    }

    // requis par NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Double) = Unit

    companion object {
        private const val EVENT = "openCarRequested"

        private var pendingVin: String? = null
        private var listener: (() -> Unit)? = null

        @Synchronized
        fun request(vin: String) {
            pendingVin = vin
            listener?.invoke()
        }

        @Synchronized
        private fun takePending(): String? = pendingVin.also { pendingVin = null }
    }
}
