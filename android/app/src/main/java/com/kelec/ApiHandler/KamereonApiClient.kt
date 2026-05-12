package com.kelec.ApiHandler

import com.kelec.BuildConfig
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Headers
import retrofit2.http.POST
import retrofit2.http.Path

object KamereonRetrofitClient {
    private const val BASE_URL = "https://api-wired-prod-1-euw1.wrd-aws.com/"
    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}


public object KamereonApiClient{
    val apiService: KamereonApiService by lazy {
        KamereonRetrofitClient.retrofit.create(KamereonApiService::class.java)
    }
}

public object KamereonCockpitApiClient{
    val apiService: KamereonCockpitApiService by lazy {
        KamereonRetrofitClient.retrofit.create(KamereonCockpitApiService::class.java)
    }
}

private const val KAMEREON_API_KEY = BuildConfig.KAMEREON_API_KEY;

interface KamereonApiService{
    @Headers("apikey: " + KAMEREON_API_KEY)
    @GET("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v2/cars/{vin}/battery-status?country=FR")
    suspend fun getBatteryStatus(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String
    ): getBatteryStatusResponse
}

interface KamereonCockpitApiService{
    @Headers("apikey: " + KAMEREON_API_KEY)
    @GET("commerce/v1/accounts/{accountId}/kamereon/kca/car-adapter/v1/cars/{vin}/cockpit?country=FR")
    suspend fun getCockpitStatus(
        @Path("accountId") accountId: String,
        @Path("vin") vin: String,
        @Header("x-gigya-id_token") idToken: String
    ): getCockpitStatusResponse
}

data class getBatteryStatusResponse(
    val data: BatteryStatusData
)

data class BatteryStatusData(
    val type: String?,
    val id: String?,
    val attributes: BatteryStatusAttributes? = null
)

data class BatteryStatusAttributes(
    val timestamp: String?,
    val batteryLevel: Int?,
    val batteryAutonomy: Int?,
    val plugStatus: Int?,
    val chargingStatus: Double?,
    val chargingRemainingTime: Int?,
)

data class getCockpitStatusResponse(
    val data: CockpitStatusData
)

data class CockpitStatusData(
    var id: String?,
    var attributes: CockpitStatusAttributes? = null
)

data class CockpitStatusAttributes(
    val totalMileage: Double?
)

data class AppPreferences(
    var useNewInterface: Boolean? = null,
    var displayMiles: Boolean? = null,
    var convertToMiles: Boolean? = null,

)