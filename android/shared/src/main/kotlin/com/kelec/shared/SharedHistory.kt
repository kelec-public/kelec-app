package com.kelec.shared

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.kelec.carapi.BatteryStatus
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Ce que le widget garde pour lui et pour l'app RN : dernier statut batterie, historique de kilométrage,
 * logs du widget. L'app RN lit ce JSON : garder les formats.
 */
class SharedHistory(context: Context) {
    private val store = SharedStore(context)
    private val gson = Gson()

    private data class MileageLog(val mileage: Double, val timestamp: String)

    private data class WidgetLog(val date: String, val message: String)

    /** Dernier statut batterie : sert de cache au widget et à l'app RN. */
    fun saveBatteryStatus(vin: String, status: BatteryStatus) {
        store.putString(StorageKey.batteryStatus(vin), gson.toJson(status))
    }

    fun loadBatteryStatus(vin: String): BatteryStatus? {
        val raw = store.getString(StorageKey.batteryStatus(vin))
            ?: store.getString(StorageKey.legacyCarData(vin))
            ?: return null
        return try {
            gson.fromJson(raw, BatteryStatus::class.java)
        } catch (e: Exception) {
            null
        }
    }

    /** Kilométrage des 30 derniers jours (historique de charge de l'app RN). */
    fun saveMileage(vin: String, mileage: Double, now: Instant = Instant.now()) = synchronized(lock) {
        val key = StorageKey.mileageHistory(vin)
        val cutoff = now.minus(30, ChronoUnit.DAYS)
        val history = readList<MileageLog>(key) + MileageLog(mileage, now.toString())
        store.putString(key, gson.toJson(history.filter { parseInstant(it.timestamp)?.isAfter(cutoff) == true }))
    }

    /** Logs des 5 derniers jours, exportés depuis les réglages de l'app (debug). */
    fun writeWidgetLog(message: String, now: Instant = Instant.now()) = synchronized(lock) {
        val cutoff = now.minus(5, ChronoUnit.DAYS)
        val logs = readList<WidgetLog>(StorageKey.WIDGET_LOGS) + WidgetLog(now.toString(), message)
        store.putString(StorageKey.WIDGET_LOGS, gson.toJson(logs.filter { parseInstant(it.date)?.isAfter(cutoff) == true }))
    }

    private inline fun <reified T> readList(key: String): List<T> {
        val raw = store.getString(key) ?: return emptyList()
        return try {
            gson.fromJson<List<T>>(raw, object : TypeToken<List<T>>() {}.type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun parseInstant(value: String?): Instant? = try {
        value?.let(Instant::parse)
    } catch (e: Exception) {
        null
    }

    private companion object {
        val lock = Any()
    }
}
