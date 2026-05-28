package com.kelec.widgets

import com.kelec.R
import android.content.Context
import kotlin.math.roundToInt

enum class ChargingState {
    SCHEDULED,
    ENDED,
    CHARGING,
    CHARGING_LEGACY_ZOE, // weired bug on 1st gen
    V2G,
    V2L,
    NOT_CHARGING;

    fun isActivelyCharging(batteryLevel: Int): Boolean = when (this) {
        CHARGING -> true
        CHARGING_LEGACY_ZOE -> batteryLevel < 100
        else -> false
    }

    fun label(context: Context): String = when (this) {
        SCHEDULED -> context.getString(R.string.scheduled_charge_status)
        ENDED -> context.getString(R.string.ended_charge_status)
        CHARGING, CHARGING_LEGACY_ZOE -> context.getString(R.string.charging_status)
        V2G -> "V2G"
        V2L -> "V2L"
        NOT_CHARGING -> context.getString(R.string.charging_status)
    }

    companion object {
        fun fromRawStatus(rawStatus: Double): ChargingState {
            val code = (rawStatus * 10.0).roundToInt()
            return when (code) {
                1, 3 -> SCHEDULED
                2 -> ENDED
                10 -> CHARGING
                -11 -> CHARGING_LEGACY_ZOE
                -13, -15, -16 -> V2G
                -14 -> V2L
                else -> NOT_CHARGING
            }
        }
    }
}