package com.kelec.shared

import org.json.JSONException
import org.json.JSONObject

/**
 * Retour du bouton de confort thermique des widgets : envoi en cours, puis réussite ou échec, affichés
 * pendant [DISPLAY_DURATION_MS]. Enregistré par voiture (`<vin>/widgetHvacStatus`) : `{"status":"SUCCESS","date":<ms>}`.
 */
data class WidgetHvacFeedback(val status: Status, val date: Long) {
    enum class Status { SENDING, SUCCESS, ERROR }

    /** Un envoi dont le processus a été tué ne doit pas bloquer le bouton : il expire aussi. */
    fun isExpired(now: Long): Boolean =
        now - date >= if (status == Status.SENDING) SENDING_TIMEOUT_MS else DISPLAY_DURATION_MS

    fun encode(): String = JSONObject().put("status", status.name).put("date", date).toString()

    companion object {
        /** Durée d'affichage de la réussite ou de l'échec. */
        const val DISPLAY_DURATION_MS = 10_000L
        const val SENDING_TIMEOUT_MS = 2 * 60_000L

        /** Température du bouton des widgets (°C), celle par défaut de l'app. */
        const val TEMPERATURE = 21

        fun decode(raw: String): WidgetHvacFeedback? = try {
            val json = JSONObject(raw)
            WidgetHvacFeedback(Status.valueOf(json.getString("status")), json.getLong("date"))
        } catch (e: JSONException) {
            null
        } catch (e: IllegalArgumentException) {
            null
        }
    }
}
