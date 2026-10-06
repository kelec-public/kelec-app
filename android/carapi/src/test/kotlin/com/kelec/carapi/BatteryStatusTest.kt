package com.kelec.carapi

import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BatteryStatusTest {
    // l'app RN relit ce JSON (`<vin>_batteryStatus`) : les noms des champs ne doivent pas changer
    @Test
    fun keepsTheStoredJsonFormat() {
        val json = Gson().toJson(BatteryStatus("2026-10-06T10:00:00Z", 80, 300, 1, 1.0, 45))
        assertEquals(
            """{"timestamp":"2026-10-06T10:00:00Z","batteryLevel":80,"batteryAutonomy":300,"plugStatus":1,"chargingStatus":1.0,"chargingRemainingTime":45}""",
            json
        )
    }

    @Test
    fun readsAPartialJson() {
        val status = Gson().fromJson("""{"batteryLevel":42}""", BatteryStatus::class.java)
        assertEquals(42, status.batteryLevel)
        assertEquals(ChargingState.NOT_CHARGING, status.chargingState)
        assertTrue(!status.isPlugged)
    }
}
