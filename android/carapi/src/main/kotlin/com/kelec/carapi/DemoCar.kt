package com.kelec.carapi

import java.time.Instant

/**
 * Voitures de démo de l'app RN (`src/assets/car_data/mockDemoData.json`) et du package iOS, mêmes VIN et valeurs :
 * une voiture en charge, une en V2G et une hybride rechargeable avec une charge programmée.
 */
enum class DemoCar(
    val vin: String,
    private val batteryLevel: Int,
    private val batteryAutonomy: Int,
    private val chargingStatus: Double,
    private val chargingRemainingTime: Int,
    /** km */
    val totalMileage: Double,
    val location: CarLocation,
) {
    CLASSIC("VF1AA", 56, 202, 1.0, 51, 30995.2, CarLocation(48.854700, 2.347749)),
    V2G("VF1AA2", 68, 265, -1.3, 0, 12480.5, CarLocation(48.8606, 2.3376)),
    HYBRID("VF1AA3", 35, 17, 0.1, 0, 45210.3, CarLocation(48.8462, 2.3371));

    /** Branchée, datée de [now] : la démo est toujours à jour. */
    fun batteryStatus(now: Instant = Instant.now()): BatteryStatus =
        BatteryStatus(now.toString(), batteryLevel, batteryAutonomy, 1, chargingStatus, chargingRemainingTime)

    companion object {
        /** Un VIN inconnu donne la voiture classique, comme dans l'app RN. */
        fun forVin(vin: String): DemoCar = entries.firstOrNull { it.vin == vin } ?: CLASSIC
    }
}
