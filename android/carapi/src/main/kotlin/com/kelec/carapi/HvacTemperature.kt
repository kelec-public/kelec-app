package com.kelec.carapi

/** Températures du confort thermique : 17 à 27 °C, LOW / HIGH aux bornes, 21 °C par défaut (comme l'app RN et iOS). */
object HvacTemperature {
    const val MIN = 17
    const val MAX = 27
    const val DEFAULT = 21

    val values: IntRange = MIN..MAX

    fun label(temperature: Int): String = when (temperature) {
        MIN -> "LOW"
        MAX -> "HIGH"
        else -> "$temperature°C"
    }

    /** Température enregistrée (« 21 »), ramenée à [DEFAULT] si elle est absente ou hors bornes. */
    fun parse(saved: String?): Int = saved?.toIntOrNull()?.takeIf { it in values } ?: DEFAULT
}
