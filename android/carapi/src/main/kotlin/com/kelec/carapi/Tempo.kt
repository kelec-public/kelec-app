package com.kelec.carapi

import java.time.LocalDate
import java.time.OffsetDateTime

/** Couleur d'un jour Tempo (valeur `value` de l'API RTE). */
enum class TempoColour(
    /** Prix heures pleines, en centimes par kWh (mêmes valeurs que le package iOS `renaultApi`). */
    val hpPrice: Double,
    /** Prix heures creuses, en centimes par kWh. */
    val hcPrice: Double,
) {
    BLUE(16.12, 13.25),
    WHITE(18.71, 14.99),
    RED(70.60, 15.75),
    UNKNOWN(0.0, 0.0);

    companion object {
        fun fromRaw(raw: String?): TempoColour = entries.firstOrNull { it.name == raw } ?: UNKNOWN
    }
}

data class TempoDay(val date: LocalDate, val colour: TempoColour)

/**
 * Les deux derniers jours Tempo connus : la veille et aujourd'hui, ou aujourd'hui et demain
 * (la couleur du lendemain est publiée en fin de matinée).
 */
data class Tempo(val previous: TempoDay, val latest: TempoDay) {
    fun latestIsTomorrow(today: LocalDate): Boolean = latest.date == today.plusDays(1)

    companion object {
        /** null s'il y a moins de deux jours dans le calendrier. */
        fun fromCalendar(values: List<TempoCalendarValue>): Tempo? {
            val days = values
                .mapNotNull { value -> parseDate(value.startDate)?.let { TempoDay(it, TempoColour.fromRaw(value.value)) } }
                .sortedBy { it.date }
            if (days.size < 2) return null
            return Tempo(previous = days[days.size - 2], latest = days.last())
        }

        private fun parseDate(value: String?): LocalDate? = try {
            value?.let { OffsetDateTime.parse(it).toLocalDate() }
        } catch (e: Exception) {
            null
        }
    }
}
