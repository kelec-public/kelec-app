package com.kelec.widgets

import android.appwidget.AppWidgetManager
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.kelec.KelecMainWIdget
import com.kelec.R
import com.kelec.shared.SharedStore
import com.kelec.shared.R as SharedR

/** Choix de la voiture d'un widget, à sa pose ou depuis « Modifier ». Nom référencé par kelec_main_w_idget_info.xml. */
class WidgetConfigureActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        setContentView(R.layout.activity_widget_configure)

        val store = SharedStore(this)
        val cars = store.loadAccount()?.cars.orEmpty()
        val container = findViewById<LinearLayout>(R.id.cars_container)

        if (cars.isEmpty()) {
            val errorText = TextView(this).apply {
                text = getString(SharedR.string.not_yet_logged_in)
                setPadding(0, 16, 0, 0)
            }
            container.addView(errorText)
            return
        }

        for (car in cars) {
            val button = Button(this).apply {
                text = car.model
                setOnClickListener { onCarSelected(store, car.vin) }
            }
            container.addView(button)
        }
    }

    private fun onCarSelected(store: SharedStore, vin: String) {
        store.saveWidgetVin(appWidgetId, vin)

        val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE, null, applicationContext, KelecMainWIdget::class.java)
        updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
        sendBroadcast(updateIntent)

        val resultIntent = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        setResult(RESULT_OK, resultIntent)
        finish()
    }
}
