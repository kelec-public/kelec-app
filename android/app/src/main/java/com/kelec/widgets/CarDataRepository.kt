package com.kelec.widgets

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import com.kelec.ApiHandler.AppPreferences
import org.json.JSONException
import org.json.JSONObject
import com.kelec.ApiHandler.BatteryStatusAttributes
import java.time.Instant

class CarDataRepository(context: Context) {
    private val context: Context = context.applicationContext
    private val prefs: SharedPreferences = this.context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // account
    fun loadAccount(): AccountSnapshot {
        val data = parseAccountData() ?: return AccountSnapshot.NotLoggedIn
        if (data.cars.isEmpty()) return AccountSnapshot.NoCars
        return data.cars.find { it.vin == data.selectedVin }
            ?.let { AccountSnapshot.Ok(it) }
            ?: AccountSnapshot.Ok(data.cars.first())
    }

    fun loadAllCars(): List<SelectedCar> = parseAccountData()?.cars ?: emptyList()

    fun loadCarByVin(vin: String): AccountSnapshot {
        val data = parseAccountData() ?: return AccountSnapshot.NotLoggedIn
        if (data.cars.isEmpty()) return AccountSnapshot.NoCars
        return data.cars.find { it.vin == vin }
            ?.let { AccountSnapshot.Ok(it) }
            ?: AccountSnapshot.Ok(data.cars.first())
    }

    private fun parseAccountData(): AccountData? {
        val raw = prefs.getString(ACCOUNT_KEY, "")?.takeIf { it.isNotEmpty() } ?: return null
        val user = try { JSONObject(raw) } catch (e: JSONException) { return null }
        val carsArray = user.optJSONArray("cars") ?: return null
        val cars = (0 until carsArray.length()).mapNotNull { i ->
            val car = carsArray.optJSONObject(i) ?: return@mapNotNull null
            val model = car.optJSONObject("car") ?: return@mapNotNull null
            SelectedCar(
                vin = model.optString("vin", ""),
                model = model.optString("model", ""),
                maker = car.optString("carMaker", ""),
                email = car.optString("email", ""),
                kamereonAccountID = car.optString("kamereonAccountID", "")
            )
        }
        return AccountData(user.optString("selectedCar", ""), cars)
    }

    private data class AccountData(val selectedVin: String, val cars: List<SelectedCar>)

    fun saveVinForWidget(appWidgetId: Int, vin: String) {
        prefs.edit().putString(widgetVinKey(appWidgetId), vin).apply()
    }

    fun loadVinForWidget(appWidgetId: Int): String? =
        prefs.getString(widgetVinKey(appWidgetId), null)?.takeIf { it.isNotEmpty() }

    fun clearVinForWidget(appWidgetId: Int) {
        prefs.edit().remove(widgetVinKey(appWidgetId)).apply()
    }

    private fun widgetVinKey(appWidgetId: Int) = "widget_vin_$appWidgetId"

    // app preferences
    fun loadAppPreferences(): AppPreferences {
        val appPreferences = AppPreferences()
        val raw = prefs.getString(APP_PREFERENCES_KEY, "") ?: ""
        if (raw.isEmpty()) return appPreferences

        return try {
            val json = JSONObject(raw)
            if (json.has("displayMiles")) appPreferences.displayMiles = json.optBoolean("displayMiles")
            if (json.has("convertToMiles")) appPreferences.convertToMiles = json.optBoolean("convertToMiles")
            appPreferences
        } catch (e: JSONException) {
            appPreferences
        }
     }

    // cached battery status
    fun loadCachedBatteryStatus(vin: String): BatteryStatusAttributes? {
        val raw = prefs.getString(vin + CAR_DATA_SUFFIX, "") ?: ""
        if (raw.isEmpty()) return null

        return try {
            val j = JSONObject(raw)
            BatteryStatusAttributes(
                j.optString("timestamp", "N/A"),
                j.optInt("batteryLevel", 0),
                j.optInt("batteryAutonomy", 0),
                j.optInt("plugStatus", 0),
                j.optDouble("chargingStatus", 0.0),
                j.optInt("chargingRemainingTime", 0)
            )
        } catch (e: JSONException) {
            null
        }
    }

    fun saveBatteryStatus(vin: String, data: BatteryStatusAttributes) {
        prefs.edit()
            .putString(vin + CAR_DATA_SUFFIX, Gson().toJson(data))
            .apply()
    }

    // password
    fun loadPassword(vin: String): String? {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val secure = EncryptedSharedPreferences.create(
                context,
                SECURE_PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )

            secure.getString(vin + PASSWORD_SUFFIX, "") ?.takeIf { it.isNotEmpty() }
        } catch (e: Exception) {
            null
        }
    }

    // types
    data class SelectedCar(
        val vin: String,
        val model: String,
        val maker: String,
        val email: String,
        val kamereonAccountID: String
    ) {
        fun isDemo(): Boolean = DEMO_CAR_MAKER == maker
    }

    sealed class AccountSnapshot {

        enum class Status { NOT_LOGGED_IN, NO_CARS, OK }
        val status: Status get() = when (this) {
            is NotLoggedIn -> Status.NOT_LOGGED_IN
            is NoCars -> Status.NO_CARS
            is Ok -> Status.OK
        }

        data object NotLoggedIn: AccountSnapshot()
        data object NoCars: AccountSnapshot()
        data class Ok(val car: SelectedCar): AccountSnapshot()
    }

    companion object {
        private const val TAG = "CarDataRepository"
        private const val PREFS_NAME = "DATA"
        private const val SECURE_PREFS_NAME = "DATA"
        private const val ACCOUNT_KEY = "account"
        private const val APP_PREFERENCES_KEY = "appPreferences"
        private const val CAR_DATA_SUFFIX = "/carData"
        private const val PASSWORD_SUFFIX = "_password"
        private const val DEMO_CAR_MAKER = "demo"

        fun demoBatteryStatus(): BatteryStatusAttributes =
            BatteryStatusAttributes(Instant.now().toString(), 62, 175, 1, 1.0, 120)
    }
}