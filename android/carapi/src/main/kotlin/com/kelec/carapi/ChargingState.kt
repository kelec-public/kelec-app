package com.kelec.carapi

import kotlin.math.roundToInt

/** État de charge, à partir du `chargingStatus` brut de Renault group. */
enum class ChargingState {
    SCHEDULED,
    ENDED,
    CHARGING,
    CHARGING_LEGACY_ZOE, // statut erroné renvoyé par les ZOE de 1re génération
    V2G,
    V2L,
    NOT_CHARGING;

    fun isActivelyCharging(batteryLevel: Int): Boolean = when (this) {
        CHARGING -> true
        CHARGING_LEGACY_ZOE -> batteryLevel < 100
        else -> false
    }

    companion object {
        fun fromRawStatus(rawStatus: Double): ChargingState = when ((rawStatus * 10.0).roundToInt()) {
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
