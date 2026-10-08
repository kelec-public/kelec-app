package com.kelec.shared

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONException
import org.json.JSONObject

/** Stockage en clair (fichier `DATA`) : compte, préférences, voiture de chaque widget. */
class SharedStore(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(StorageKey.FILE, Context.MODE_PRIVATE)

    fun getString(key: String): String? = prefs.getString(key, null)

    fun putString(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }

    /** null si l'utilisateur n'est pas connecté (compte absent, `"null"` ou illisible). */
    fun loadAccount(): UserAccount? {
        val raw = getString(StorageKey.ACCOUNT)?.takeIf { it.isNotEmpty() } ?: return null
        val json = try { JSONObject(raw) } catch (e: JSONException) { return null }
        val carsArray = json.optJSONArray("cars") ?: return null
        val cars = (0 until carsArray.length()).mapNotNull { i ->
            val account = carsArray.optJSONObject(i) ?: return@mapNotNull null
            val car = account.optJSONObject("car") ?: return@mapNotNull null
            UserCar(
                vin = car.optString("vin", ""),
                model = car.optString("model", ""),
                maker = CarMaker.fromRaw(account.optString("carMaker", "")),
                email = account.optString("email", ""),
                kamereonAccountId = account.optString("kamereonAccountID", ""),
                imageUrl = car.optString("imageUrl", ""),
            )
        }
        return UserAccount(cars)
    }

    /** null si les préférences sont absentes ou illisibles (l'appelant prend alors les valeurs par défaut). */
    fun loadPreferences(): AppPreferences? {
        val raw = getString(StorageKey.APP_PREFERENCES)?.takeIf { it.isNotEmpty() } ?: return null
        return try {
            val json = JSONObject(raw)
            AppPreferences(
                displayMiles = json.optBoolean("displayMiles", false),
                convertToMiles = json.optBoolean("convertToMiles", false),
            )
        } catch (e: JSONException) {
            null
        }
    }

    fun widgetVin(appWidgetId: Int): String? = getString(StorageKey.widgetVin(appWidgetId))?.takeIf { it.isNotEmpty() }

    fun saveWidgetVin(appWidgetId: Int, vin: String) = putString(StorageKey.widgetVin(appWidgetId), vin)

    fun clearWidgetVin(appWidgetId: Int) = remove(StorageKey.widgetVin(appWidgetId))

    /** Montre : VIN de la voiture des complications, choisi dans les Réglages de l'app de la montre. */
    fun watchWidgetVin(): String? = getString(StorageKey.WATCH_WIDGET_CAR)?.takeIf { it.isNotEmpty() }

    fun saveWatchWidgetVin(vin: String) = putString(StorageKey.WATCH_WIDGET_CAR, vin)

    /** Montre : dernière température du confort thermique de la voiture (« 21 »), même format que l'app RN. */
    fun savedTemperature(vin: String): String? = getString(StorageKey.savedTemperature(vin))

    fun saveTemperature(vin: String, temperature: Int) = putString(StorageKey.savedTemperature(vin), temperature.toString())
}
