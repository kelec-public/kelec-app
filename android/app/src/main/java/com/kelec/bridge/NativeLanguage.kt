package com.kelec.bridge

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Langue du téléphone, lue de façon synchrone par languageHandler. */
class NativeLanguage(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "NativeLanguage"

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getLanguage(): String = reactApplicationContext.resources.configuration.locales[0].language
}
