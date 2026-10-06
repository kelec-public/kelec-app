package com.kelec.shared

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject

/**
 * Stockage chiffré (`EncryptedSharedPreferences`, fichier `DATA` partagé avec le stockage en clair).
 * Inchangé depuis les premières versions : ne pas modifier le fichier ni les schémas de chiffrement.
 */
class SecureStore(context: Context) {
    private val context = context.applicationContext

    private fun open(): SharedPreferences {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            StorageKey.FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    /** null si la clé est absente, vide ou illisible. */
    fun get(key: String): String? = try {
        open().getString(key, null)?.takeIf { it.isNotEmpty() }
    } catch (e: Exception) {
        Log.e(TAG, "Unable to read encrypted data", e)
        null
    }

    /** @throws Exception si le stockage chiffré ne peut pas être ouvert. */
    fun set(key: String, value: String) {
        open().edit().putString(key, value).commit()
    }

    /** @throws Exception si le stockage chiffré ne peut pas être ouvert. */
    fun remove(key: String) {
        open().edit().remove(key).commit()
    }

    /** Cookie de session Renault group, enregistré par l'app RN en JSON `{canLogin, cookieValue}`. */
    fun renaultCookieValue(email: String): String? {
        val raw = get(StorageKey.cookieValue(email)) ?: return null
        return try {
            val json = JSONObject(raw)
            if (json.isNull("cookieValue")) null else json.optString("cookieValue").takeIf { it.isNotEmpty() }
        } catch (e: Exception) {
            null
        }
    }

    private companion object {
        const val TAG = "SecureStore"
    }
}
