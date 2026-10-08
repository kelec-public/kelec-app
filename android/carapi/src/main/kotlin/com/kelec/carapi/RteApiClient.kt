package com.kelec.carapi

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Calendrier Tempo de RTE (même requête que `rteApi` du package iOS).
 * [basicAuth] : identifiants RTE déjà encodés en base64 (`RTE_BASIC_AUTH` du `.env`).
 * Lève une exception en cas d'échec : à l'appelant de se rabattre sur le cache.
 */
class RteApiClient(private val basicAuth: String) {

    suspend fun fetchTempo(today: LocalDate = LocalDate.now(PARIS)): Tempo {
        val token = RteServices.rte.getToken("Basic $basicAuth").accessToken
            ?: throw IllegalStateException("RTE token missing")
        val calendar = RteServices.rte.getTempoCalendar(
            bearer = "Bearer $token",
            startDate = formatDay(today.minusDays(1)),
            endDate = formatDay(today.plusDays(2)),
        )
        return Tempo.fromCalendar(calendar.calendars?.values.orEmpty())
            ?: throw IllegalStateException("RTE calendar has less than 2 days")
    }

    companion object {
        val PARIS: ZoneId = ZoneId.of("Europe/Paris")
        private val DAY_START = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.ROOT)

        /** Début du jour à Paris : « 2026-10-08T00:00:00+02:00 » (Retrofit encode le « + »). */
        internal fun formatDay(day: LocalDate): String = day.atStartOfDay(PARIS).format(DAY_START)
    }
}

internal object RteServices {
    private const val BASE_URL = "https://digital.iservices.rte-france.com/"

    val rte: RteService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(RteService::class.java)
    }
}

internal interface RteService {
    @POST("token/oauth/")
    suspend fun getToken(@Header("Authorization") authorization: String): RteToken

    @GET("open_api/tempo_like_supply_contract/v1/tempo_like_calendars")
    suspend fun getTempoCalendar(
        @Header("Authorization") bearer: String,
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String,
        @Header("Accept") accept: String = "application/json",
    ): TempoCalendarResponse
}

internal data class RteToken(@SerializedName("access_token") val accessToken: String?)

internal data class TempoCalendarResponse(
    @SerializedName("tempo_like_calendars") val calendars: TempoCalendars?,
)

internal data class TempoCalendars(val values: List<TempoCalendarValue>?)

data class TempoCalendarValue(
    @SerializedName("start_date") val startDate: String?,
    val value: String?,
)
