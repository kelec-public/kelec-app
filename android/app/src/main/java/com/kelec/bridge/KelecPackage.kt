package com.kelec.bridge

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Modules natifs de l'app (hors autofill) : stockage partagé, langue du téléphone, synchro de la montre Wear OS. */
class KelecPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(RNSharedWidget(reactContext), NativeLanguage(reactContext), WearSync(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
