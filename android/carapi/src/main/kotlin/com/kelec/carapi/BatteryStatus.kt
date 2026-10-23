package com.kelec.carapi

import java.time.Instant

/**
 * Statut batterie Renault group (attributs de `battery-status`).
 * Enregistré tel quel en JSON (Gson) et relu par l'app RN : ne pas renommer les champs.
 */
data class BatteryStatus(
    val timestamp: String?,
    val batteryLevel: Int?,
    val batteryAutonomy: Int?,
    val plugStatus: Int?,
    val chargingStatus: Double?,
    val chargingRemainingTime: Int?,
) {
    val isPlugged: Boolean get() = plugStatus == PLUG_STATUS_PLUGGED

    val chargingState: ChargingState get() = ChargingState.fromRawStatus(chargingStatus ?: 0.0)

    companion object {
        private const val PLUG_STATUS_PLUGGED = 1

        /** Statut de la voiture de démo [vin] (voir [DemoCar]). */
        fun demo(vin: String = DemoCar.CLASSIC.vin, now: Instant = Instant.now()): BatteryStatus =
            DemoCar.forVin(vin).batteryStatus(now)
    }
}
