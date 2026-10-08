package com.kelec.carapi

import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Test

class HvacTest {
    // même corps que l'app RN (`launchHVACApi`) et le package iOS
    @Test
    fun hvacStartBody() {
        assertEquals(
            """{"data":{"type":"HvacStart","id":"-------","attributes":{"action":"start","id":"-------","targetTemperature":21}}}""",
            Gson().toJson(HvacStartRequest.start(21))
        )
    }

    @Test
    fun temperatureLabels() {
        assertEquals("LOW", HvacTemperature.label(17))
        assertEquals("21°C", HvacTemperature.label(21))
        assertEquals("HIGH", HvacTemperature.label(27))
    }

    @Test
    fun savedTemperature() {
        assertEquals(19, HvacTemperature.parse("19"))
        assertEquals(21, HvacTemperature.parse(null))
        assertEquals(21, HvacTemperature.parse("30"))
        assertEquals(21, HvacTemperature.parse("abc"))
    }
}
