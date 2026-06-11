package com.kelec.modules.autofill

import android.view.View
import android.view.autofill.AutofillManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType

class AutofillModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AutofillModule"

    @ReactMethod
    fun notifyViewEntered(tag: Int) {
        reactApplicationContext.currentActivity?.runOnUiThread {
            val uiManager = UIManagerHelper.getUIManager(
                reactApplicationContext,
                UIManagerType.LEGACY
            )
            val view = uiManager?.resolveView(tag) ?: run {
                return@runOnUiThread
            }

            if (!view.isAttachedToWindow) {
                view.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
                    override fun onViewAttachedToWindow(v: View) {
                        v.removeOnAttachStateChangeListener(this)
                        val afm = reactApplicationContext.currentActivity
                            ?.getSystemService(AutofillManager::class.java) ?: return
                        afm.notifyViewEntered(v)
                    }
                    override fun onViewDetachedFromWindow(v: View) {}
                })
                return@runOnUiThread
            }

            val afm = reactApplicationContext.currentActivity
                ?.getSystemService(AutofillManager::class.java) ?: return@runOnUiThread
            afm.notifyViewEntered(view)
        }
    }
    @ReactMethod
    fun commit() {
        reactApplicationContext.currentActivity?.runOnUiThread {
            val afm = reactApplicationContext.currentActivity
                ?.getSystemService(AutofillManager::class.java) ?: return@runOnUiThread
            afm.commit()
        }
    }

    @ReactMethod
    fun cancel() {
        reactApplicationContext.currentActivity?.runOnUiThread {
            val afm = reactApplicationContext.currentActivity
                ?.getSystemService(AutofillManager::class.java) ?: return@runOnUiThread
            afm.cancel()

        }
    }
}