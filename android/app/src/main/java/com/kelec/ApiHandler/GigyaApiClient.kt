package com.kelec.ApiHandler

import com.kelec.BuildConfig
import retrofit2.Retrofit
import retrofit2.http.*
import retrofit2.Call
import retrofit2.converter.gson.GsonConverterFactory

object GigyaRetrofitClient {
    private const val BASE_URL = "https://gigya-prod-eu1.renaultgroup.com/"

    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}

public object GigyaApiClient {
    val apiService: GigyaApiService by lazy {
        GigyaRetrofitClient.retrofit.create(GigyaApiService::class.java)
    }
}

private const val GIGYA_API_KEY = BuildConfig.GIGYA_API_KEY;
interface GigyaApiService {

    // to get the account cookieValue
    @FormUrlEncoded
    @POST("accounts.login")
    suspend fun getGigyaToken(
        @Field("loginID") loginID: String,
        @Field("password") password: String,
        @Field("include") include: String = "data",
        @Field("APIKey") apiKey: String = GIGYA_API_KEY
    ): getGigyaTokenResponse;

    @FormUrlEncoded
    @POST("accounts.getJWT")
    suspend fun getJWTToken(
        @Field("login_token") login_token: String,
        @Field("fields") fields: String = "data.personId,data.gigyaDataCenter",
        @Field("expiration") expiration: Int = 1800,
        @Field("APIKey") apiKey: String = GIGYA_API_KEY
    ): getJWTTokenResponse;
}


data class getGigyaTokenResponse(
    // to get the cookieValue (gigya token)
    val errorCode: Int,
    val errorDetails: String,
    val errorMessage: String,
    val statusCode: Int,
    val statusReason: String,
    var data: GigyaTokenData,
    var sessionInfo: GigyaTokenSessionInfo
)
data class GigyaTokenData(
    val personId: String,
    var gigyaDataCenter: String,
)

data class GigyaTokenSessionInfo(
    val cookieName: String,
    val cookieValue: String,
)

data class getJWTTokenResponse(
    //  to get the JWT token
    val errorCode: Int,
    val errorDetails: String,
    val errorMessage: String,
    val statusCode: Int,
    val statusReason: String,
    var id_token: String,
)