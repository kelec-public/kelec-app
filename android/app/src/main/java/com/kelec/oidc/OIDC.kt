package com.kelec.oidc

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import android.util.Base64
import android.util.Log
import com.kelec.BuildConfig
import org.json.JSONObject

class OIDC(
    context: Context
) {
    private val context: Context = context.applicationContext

    companion object {
        // Partagé entre l'app et les widgets (même process) — évite les double-refresh
        private val refreshMutex = Mutex()
    }

    fun getTokenBlocking(email: String): OidcTokens? {
        return runBlocking { getToken(email) }
    }

    private fun getJwtExpiration(token: String): Long? {
        return try {
            val payload = token.split(".")[1]
            val decoded = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING)
            val json = JSONObject(String(decoded))
            json.optLong("exp", -1).takeIf { it != -1L }
        } catch (e: Exception) {
            null
        }
    }

    private fun isExpired(tokens: OidcTokens): Boolean {
        val exp = getJwtExpiration(tokens.accessToken) ?: return false
        val now = System.currentTimeMillis() / 1000L
        return exp < now + 30
    }

    suspend fun getToken(email: String): OidcTokens? {
        val tokens = getTokenFromSecureStorage(email) ?: return null
        if (!isExpired(tokens)) {
            return tokens
        }

        // Double-check sous verrou : un autre thread a peut-être déjà rafraîchi
        return refreshMutex.withLock {
            val fresh = getTokenFromSecureStorage(email) ?: return@withLock null
            if (!isExpired(fresh)) {
                return@withLock fresh
            }
            val rawRefreshed = refreshTokens(fresh) ?: return@withLock null
            // le endpoint refresh ne retourne pas email/personId, on les préserve
            val refreshed = rawRefreshed.copy(email = fresh.email, personId = fresh.personId)
            saveTokensToSecureStorage(refreshed)
            Log.d("OIDC", "Token refreshed: $refreshed")
            refreshed
        }
    }

    suspend fun refreshTokens(tokens: OidcTokens): OidcTokens? {
        return try {
            val response = OidcApiClient.apiService.refreshToken(
                url = BuildConfig.OIDC_ENDPOINT_TOKEN + "/",
                refreshToken = tokens.refreshToken,
                scope = "openid email personId lang renaultGroupFull",
                redirectUri = BuildConfig.OIDC_REDIRECT_URI,
                clientId = BuildConfig.OIDC_CLIENT_ID,
                grantType = "refresh_token"
            )

            if (response.isSuccessful) {
                response.body()
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun getTokenFromSecureStorage(email: String): OidcTokens? {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();

            val secure = EncryptedSharedPreferences.create(
                context,
                "DATA",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )

            val tokensString = secure.getString(email + "_tokens", null) ?: return null

            Gson().fromJson(tokensString, OidcTokens::class.java)
        } catch (e: Exception) {
            return null
        }
    }

    suspend fun saveTokensToSecureStorage(tokens: OidcTokens) {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val secure = EncryptedSharedPreferences.create(
                context,
                "DATA",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )

            val tokensString = Gson().toJson(tokens)
            val email = tokens.email
            secure.edit().putString(email + "_tokens", tokensString).apply()
        } catch(e: Exception) {
            // rien à faire de spécial
        }
    }
}