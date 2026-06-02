package com.kelec.oidc

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object OidcRetrofitClient {
    private const val BASE_URL = "???";
    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}

public object OidcApiClient {
    val apiService: OidcService by lazy {
        OidcRetrofitClient.retrofit.create(OidcService::class.java);
    }
}
