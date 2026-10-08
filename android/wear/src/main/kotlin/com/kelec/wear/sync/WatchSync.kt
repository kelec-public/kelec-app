package com.kelec.wear.sync

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMap
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import com.kelec.shared.SecureStore
import com.kelec.shared.SharedStore
import com.kelec.shared.StorageKey
import com.kelec.shared.WearSyncContract
import com.kelec.wear.complication.BatteryComplicationService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

/**
 * Reçoit ce qu'envoie le téléphone (Réglages → synchroniser avec la montre, module `WearSync`) :
 * compte sans mot de passe, préférences, sessions Renault, mots de passe Hyundai. Pendant de `WatchSync.swift`.
 */
object WatchSync {
    private const val TAG = "WatchSync"

    private val _lastSync = MutableStateFlow(0L)

    /** Change à chaque synchro qui modifie le compte ou les préférences : les écrans se rechargent. */
    val lastSync: StateFlow<Long> = _lastSync

    /** Relit la dernière synchro (arrivée app fermée ou avant l'installation de l'app de la montre). */
    suspend fun loadLatest(context: Context) {
        try {
            val items = Wearable.getDataClient(context).dataItems.await()
            try {
                items.filter { it.uri.path == WearSyncContract.PATH }
                    .forEach { save(context, DataMapItem.fromDataItem(it).dataMap) }
            } finally {
                items.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Unable to read the synced data", e)
        }
    }

    fun save(context: Context, data: DataMap) {
        val secureStore = SecureStore(context)
        saveCookies(secureStore, data.getString(WearSyncContract.COOKIE_VALUES))
        savePasswords(secureStore, data.getString(WearSyncContract.PASSWORDS))

        val store = SharedStore(context)
        val preferencesChanged = saveIfChanged(store, StorageKey.APP_PREFERENCES, data.getString(WearSyncContract.APP_PREFERENCES))
        val accountChanged = saveIfChanged(store, StorageKey.ACCOUNT, data.getString(WearSyncContract.ACCOUNT))

        if (preferencesChanged || accountChanged) {
            BatteryComplicationService.requestUpdate(context)
            _lastSync.value = System.currentTimeMillis()
        }
    }

    /** Sessions Renault group par email, enregistrées comme le fait l'app du téléphone (`cookieValue_<email>`). */
    private fun saveCookies(secureStore: SecureStore, json: String?) {
        val cookies = parse(json) ?: return
        cookies.keys().forEach { email ->
            val entry = cookies.optJSONObject(email) ?: return@forEach
            runCatching { secureStore.set(StorageKey.cookieValue(email), entry.toString()) }
                .onFailure { Log.e(TAG, "Unable to save the session", it) }
        }
    }

    /** Mots de passe (Hyundai) par VIN. Une clé absente n'efface jamais un mot de passe déjà enregistré. */
    private fun savePasswords(secureStore: SecureStore, json: String?) {
        val passwords = parse(json) ?: return
        passwords.keys().forEach { vin ->
            val password = passwords.optString(vin)
            if (password.isNotEmpty()) {
                runCatching { secureStore.set(StorageKey.password(vin), password) }
                    .onFailure { Log.e(TAG, "Unable to save the password", it) }
            }
        }
    }

    /** true si la valeur a changé. Une valeur absente ou illisible ne remplace rien. */
    private fun saveIfChanged(store: SharedStore, key: String, json: String?): Boolean {
        if (json == null || parse(json) == null || store.getString(key) == json) return false
        store.putString(key, json)
        return true
    }

    private fun parse(json: String?): JSONObject? = try {
        json?.let(::JSONObject)
    } catch (e: Exception) {
        null
    }
}

/** Réveillé par le système quand le téléphone envoie une synchro, même si l'app de la montre est fermée. */
class WatchSyncListenerService : WearableListenerService() {
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents
            .filter { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == WearSyncContract.PATH }
            .forEach { WatchSync.save(this, DataMapItem.fromDataItem(it.dataItem).dataMap) }
    }
}
