package com.kelec.oidc

import retrofit2.Response
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.POST
import retrofit2.http.Url

interface OidcService {
    @FormUrlEncoded
    @POST
    suspend fun refreshToken(
        @Url url: String,
        @Field("refresh_token") refreshToken: String,
        @Field("scope") scope: String,
        @Field("redirect_uri") redirectUri: String,
        @Field("client_id") clientId: String,
        @Field("grant_type") grantType: String
    ): Response<OidcTokens>
}

