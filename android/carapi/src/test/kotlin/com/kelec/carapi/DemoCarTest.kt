package com.kelec.carapi

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class DemoCarTest {
    @Test
    fun eachDemoCarHasItsChargingState() {
        assertEquals(ChargingState.CHARGING, BatteryStatus.demo("VF1AA").chargingState)
        assertEquals(ChargingState.V2G, BatteryStatus.demo("VF1AA2").chargingState)
        assertEquals(ChargingState.SCHEDULED, BatteryStatus.demo("VF1AA3").chargingState)
        assertTrue(DemoCar.entries.all { it.batteryStatus().isPlugged })
    }

    @Test
    fun unknownVinIsTheClassicCar() {
        assertEquals(DemoCar.CLASSIC, DemoCar.forVin("inconnu"))
    }

    @Test
    fun isDatedNow() {
        val now = Instant.parse("2026-10-23T10:00:00Z")
        assertEquals("2026-10-23T10:00:00Z", BatteryStatus.demo("VF1AA2", now).timestamp)
    }
}
