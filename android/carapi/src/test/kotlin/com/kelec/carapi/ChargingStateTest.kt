package com.kelec.carapi

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChargingStateTest {
    @Test
    fun mapsRawStatus() {
        assertEquals(ChargingState.SCHEDULED, ChargingState.fromRawStatus(0.1))
        assertEquals(ChargingState.SCHEDULED, ChargingState.fromRawStatus(0.3))
        assertEquals(ChargingState.ENDED, ChargingState.fromRawStatus(0.2))
        assertEquals(ChargingState.CHARGING, ChargingState.fromRawStatus(1.0))
        assertEquals(ChargingState.CHARGING_LEGACY_ZOE, ChargingState.fromRawStatus(-1.1))
        assertEquals(ChargingState.V2G, ChargingState.fromRawStatus(-1.3))
        assertEquals(ChargingState.V2L, ChargingState.fromRawStatus(-1.4))
        assertEquals(ChargingState.NOT_CHARGING, ChargingState.fromRawStatus(0.0))
    }

    @Test
    fun legacyZoeChargesUntilFull() {
        assertTrue(ChargingState.CHARGING_LEGACY_ZOE.isActivelyCharging(99))
        assertFalse(ChargingState.CHARGING_LEGACY_ZOE.isActivelyCharging(100))
        assertFalse(ChargingState.SCHEDULED.isActivelyCharging(50))
    }
}
