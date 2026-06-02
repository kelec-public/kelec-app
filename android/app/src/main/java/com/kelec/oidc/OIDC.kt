package com.kelec.oidc

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.google.gson.Gson
import kotlinx.coroutines.runBlocking
import android.util.Base64
import android.util.Log
import com.kelec.BuildConfig
import org.json.JSONObject

class OIDC(
    context: Context
) {
    private val context: Context = context.applicationContext

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

    suspend fun getToken(email: String): OidcTokens? {
        // 1ère étape on récupère le token
        val tokens = getTokenFromSecureStorage(email) ?: return null

        val accessToken = tokens.accessToken
        val exp = getJwtExpiration(accessToken)
        val now = System.currentTimeMillis() / 1000L // unix timestamp

        return if (exp != null && exp < now + 30) {
            val refreshedTokens = refreshTokens(tokens) ?: return  null
            saveTokensToSecureStorage(refreshedTokens)
            refreshedTokens
        } else {
            tokens
        }
    }

    suspend fun refreshTokens(tokens: OidcTokens): OidcTokens? {
        return try {
            val response = OidcApiClient.apiService.refreshToken(
                url = BuildConfig.OIDC_ENDPOINT_TOKEN,
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