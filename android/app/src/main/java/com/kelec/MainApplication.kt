package com.kelec

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.kelec.bridge.KelecPackage
import com.kelec.modules.autofill.AutofillPackage
import com.lugg.RNCConfig.RNCConfigPackage

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // add(MyReactNativePackage())
                    add(KelecPackage())
                    add(RNCConfigPackage())
                    add(AutofillPackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
    }
}
