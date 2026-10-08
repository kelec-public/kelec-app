package com.kelec.carapi

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Field
import retrofit2.http.FormUrlEncoded
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Headers
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

    @GET("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/location?country=FR")
    suspend fun getLocation(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String,
        @Header("apikey") apiKey: String,
    ): KamereonResponse<CarLocation>

    @Headers("Content-Type: application/vnd.api+json")
    @POST("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/actions/hvac-start?country=FR")
    suspend fun startHvac(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String,
        @Header("apikey") apiKey: String,
        @Body body: HvacStartRequest,
    ): HvacStartResponse
}

internal data class JwtResponse(
    @SerializedName("id_token") val idToken: String?,
)

internal data class KamereonResponse<T>(val data: KamereonData<T>?)

internal data class KamereonData<T>(val attributes: T?)

internal data class Cockpit(val totalMileage: Double?)

/** Position de la voiture (`location`) : null si la voiture ne la renvoie pas. */
data class CarLocation(val gpsLatitude: Double?, val gpsLongitude: Double?)

/** Corps de `hvac-start`, identique à l'app RN et au package iOS. */
internal data class HvacStartRequest(val data: HvacStartData) {
    companion object {
        fun start(temperature: Int) = HvacStartRequest(HvacStartData(attributes = HvacStartAttributes(targetTemperature = temperature)))
    }
}

internal data class HvacStartData(
    val type: String = "HvacStart",
    val id: String = "-------",
    val attributes: HvacStartAttributes,
)

internal data class HvacStartAttributes(
    val action: String = "start",
    val id: String = "-------",
    val targetTemperature: Int,
)

internal data class HvacStartResponse(val data: HvacStartResponseData?)

internal data class HvacStartResponseData(val type: String?, val id: String?)
