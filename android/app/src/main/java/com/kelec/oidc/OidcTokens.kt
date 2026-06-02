package com.kelec.oidc

import com.google.gson.annotations.SerializedName


data class OidcTokens (
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("expires_in")
    val expiresIn: Int,
    @SerializedName("id_token")
    val idToken: String,
    @SerializedName("refresh_token")
    val refreshToken: String,
    @SerializedName("token_type")
    val tokenType: String,
    @SerializedName("email")
    val email: String,
    @SerializedName("personId")
    val personId: String
)