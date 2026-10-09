package com.kelec

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.kelec.bridge.OpenCarRequests
import com.kelec.shortcuts.CarShortcuts

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Kelec"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        openCar(intent)
        // les raccourcis suivent le compte, aussi pour les utilisateurs qui viennent de mettre l'app à jour
        CarShortcuts.update(this)
    }

    // app déjà ouverte (launchMode singleTask) : raccourci ou widget
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        openCar(intent)
    }

    /** Raccourci ou widget d'une voiture : l'app RN affiche sa page. Pas en relançant l'app depuis les récents. */
    private fun openCar(intent: Intent?) {
        if (intent == null || (intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return
        CarShortcuts.vinFrom(intent)?.let { OpenCarRequests.request(it) }
    }
}
