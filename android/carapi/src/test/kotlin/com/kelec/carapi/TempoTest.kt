package com.kelec.carapi

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class TempoTest {
    private val today = LocalDate.of(2026, 10, 8)

    private fun day(date: String, colour: String) = TempoCalendarValue("${date}T00:00:00+02:00", colour)

    @Test
    fun keepsTheLastTwoDaysWhateverTheOrder() {
        // RTE renvoie les jours du plus récent au plus ancien
        val tempo = Tempo.fromCalendar(listOf(day("2026-10-09", "RED"), day("2026-10-08", "WHITE"), day("2026-10-07", "BLUE")))!!

        assertEquals(TempoDay(LocalDate.of(2026, 10, 8), TempoColour.WHITE), tempo.previous)
        assertEquals(TempoDay(LocalDate.of(2026, 10, 9), TempoColour.RED), tempo.latest)
        assertTrue(tempo.latestIsTomorrow(today))
    }

    @Test
    fun latestIsTodayBeforeTomorrowIsPublished() {
        val tempo = Tempo.fromCalendar(listOf(day("2026-10-07", "BLUE"), day("2026-10-08", "BLUE")))!!

        assertFalse(tempo.latestIsTomorrow(today))
    }

    @Test
    fun needsTwoDays() {
        assertNull(Tempo.fromCalendar(listOf(day("2026-10-08", "BLUE"))))
        assertNull(Tempo.fromCalendar(listOf(day("2026-10-08", "BLUE"), TempoCalendarValue("bad date", "RED"))))
    }

    @Test
    fun unknownColour() {
        val tempo = Tempo.fromCalendar(listOf(day("2026-10-07", "BLUE"), day("2026-10-08", "PINK")))!!

        assertEquals(TempoColour.UNKNOWN, tempo.latest.colour)
    }

    @Test
    fun pricesAreTheIosOnes() {
        assertEquals(16.12, TempoColour.BLUE.hpPrice, 0.0)
        assertEquals(15.75, TempoColour.RED.hcPrice, 0.0)
    }

    @Test
    fun formatsTheDayStartInParis() {
        assertEquals("2026-10-08T00:00:00+02:00", RteApiClient.formatDay(today))
        assertEquals("2026-12-01T00:00:00+01:00", RteApiClient.formatDay(LocalDate.of(2026, 12, 1)))
    }
}
