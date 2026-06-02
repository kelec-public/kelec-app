package com.kelec.oidc

import com.kelec.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object OidcRetrofitClient {
    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.OIDC_ENDPOINT_TOKEN + "/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}

public object OidcApiClient {
    val apiService: OidcService by lazy {
        OidcRetrofitClient.retrofit.create(OidcService::class.java);
    }
}
