package com.kelec.ApiHandler

import com.kelec.BuildConfig
import retrofit2.Retrofit
import retrofit2.http.*
import retrofit2.Call
import retrofit2.converter.gson.GsonConverterFactory

object GigyaRetrofitClient {
    private const val BASE_URL = "https://accounts.eu1.gigya.com/"

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
    @GET("accounts.login?include=data&apiKey=" + GIGYA_API_KEY)
    suspend fun getGigyaToken(
        @Query("loginID") loginID: String,
        @Query("password") password: String
    ): getGigyaTokenResponse;

    @GET("accounts.getJWT?expiration=87000&fields=data.personId, data.gigyaDataCenter&ApiKey=" + GIGYA_API_KEY)
    suspend fun getJWTToken(
        @Query("login_token") login_token: String
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