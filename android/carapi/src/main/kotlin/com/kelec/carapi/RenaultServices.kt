package com.kelec.carapi

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

/** Clés d'API Renault group : fournies par l'app qui utilise le client (BuildConfig, react-native-config). */
data class RenaultApiKeys(
    val gigyaApiKey: String,
    val kamereonApiKey: String,
)

internal object RenaultServices {
    private const val GIGYA_BASE_URL = "https://gigya-prod-eu1.renaultgroup.com/"
    private const val KAMEREON_BASE_URL = "https://api-wired-prod-1-euw1.wrd-aws.com/"

    val gigya: GigyaService by lazy { retrofit(GIGYA_BASE_URL).create(GigyaService::class.java) }
    val kamereon: KamereonService by lazy { retrofit(KAMEREON_BASE_URL).create(KamereonService::class.java) }

    private fun retrofit(baseUrl: String): Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}

internal interface GigyaService {
    @FormUrlEncoded
    @POST("accounts.getJWT")
    suspend fun getJWT(
        @Field("login_token") loginToken: String,
        @Field("APIKey") apiKey: String,
        @Field("fields") fields: String = "data.personId,data.gigyaDataCenter",
        @Field("expiration") expiration: Int = 1800,
    ): JwtResponse
}

internal interface KamereonService {
    @GET("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v2/cars/{vin}/battery-status?country=FR")
    suspend fun getBatteryStatus(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String,
        @Header("apikey") apiKey: String,
    ): KamereonResponse<BatteryStatus>

    @GET("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/cockpit?country=FR")
    suspend fun getCockpit(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String,
        @Header("apikey") apiKey: String,
    ): KamereonResponse<Cockpit>
}

internal data class JwtResponse(
    @SerializedName("id_token") val idToken: String?,
)

internal data class KamereonResponse<T>(val data: KamereonData<T>?)

internal data class KamereonData<T>(val attributes: T?)

internal data class Cockpit(val totalMileage: Double?)
