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
        val raw = prefs.getString(ACCOUNT_KEY, "") ?: ""
        val user = try {
            JSONObject(raw)
        } catch(e: JSONException) {
            return AccountSnapshot.NotLoggedIn
        }

        val cars = user.optJSONArray("cars") ?: return AccountSnapshot.NotLoggedIn
        if (cars.length() == 0) return AccountSnapshot.NoCars

        val selectedVin = user.optString("selectedCar", "")
        for (i in 0 until cars.length()) {
            val car = cars.optJSONObject(i) ?: continue
            val model = car.optJSONObject("car") ?: continue

            if (selectedVin == model.optString("vin", "")) {
                return AccountSnapshot.Ok(
                    SelectedCar(
                        vin = selectedVin,
                        model = model.optString("model", ""),
                        maker = car.optString("carMaker", ""),
                        email = car.optString("email", ""),
                        kamereonAccountID = car.optString("kamereonAccountID", "")
                    )
                )
            }
        }
        return AccountSnapshot.CarNotFound
    }

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

        enum class Status { NOT_LOGGED_IN, NO_CARS, CAR_NOT_FOUND, OK }
        val status: Status get() = when (this) {
            is NotLoggedIn -> Status.NOT_LOGGED_IN
            is NoCars -> Status.NO_CARS
            is CarNotFound -> Status.CAR_NOT_FOUND
            is Ok -> Status.OK
        }

        data object NotLoggedIn: AccountSnapshot()
        data object NoCars: AccountSnapshot()
        data object CarNotFound: AccountSnapshot()
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