package com.kelec.shared

import android.content.Context
import com.kelec.carapi.RteApiClient
import com.kelec.carapi.Tempo
import com.kelec.carapi.TempoColour
import com.kelec.carapi.TempoDay
import org.json.JSONObject
import java.time.LocalDate
import kotlin.coroutines.cancellation.CancellationException

/** Jours Tempo des widgets : requête RTE, cache (`tempo`), et retour au cache en cas d'échec (comme `TempoService` sur iOS). */
class TempoLoader(context: Context, private val rteBasicAuth: String) {
    private val store = SharedStore(context)
    private val history = SharedHistory(context)

    suspend fun load(): Tempo? = try {
        RteApiClient(rteBasicAuth).fetchTempo().also {
            save(it)
            history.writeWidgetLog("Tempo data fetched")
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        history.writeWidgetLog("Loading cached Tempo data: ${e.message}")
        cached()
    }

    /** Dernier Tempo enregistré, null s'il n'y en a pas (ou illisible). */
    fun cached(): Tempo? {
        val raw = store.getString(StorageKey.TEMPO) ?: return null
        return try {
            val json = JSONObject(raw)
            Tempo(previous = readDay(json.getJSONObject("previous")), latest = readDay(json.getJSONObject("latest")))
        } catch (e: Exception) {
            null
        }
    }

    private fun save(tempo: Tempo) {
        val json = JSONObject()
            .put("previous", writeDay(tempo.previous))
            .put("latest", writeDay(tempo.latest))
        store.putString(StorageKey.TEMPO, json.toString())
    }

    private fun writeDay(day: TempoDay) = JSONObject().put("date", day.date.toString()).put("colour", day.colour.name)

    private fun readDay(json: JSONObject) = TempoDay(LocalDate.parse(json.getString("date")), TempoColour.fromRaw(json.getString("colour")))
}
