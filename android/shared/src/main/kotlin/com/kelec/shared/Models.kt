package com.kelec.shared

/** Constructeur tel qu'enregistré par l'app RN (`carMaker`). */
enum class CarMaker(val raw: String) {
    RENAULT("renault"),
    DACIA("dacia"),
    ALPINE("alpine"),
    HYUNDAI("hyundai"),
    DEMO("demo"),
    UNKNOWN("");

    companion object {
        fun fromRaw(raw: String): CarMaker = entries.firstOrNull { it.raw == raw } ?: UNKNOWN
    }
}

/** Une voiture du compte : un VIN est unique dans l'app et a exactement un compte. */
data class UserCar(
    val vin: String,
    val model: String,
    val maker: CarMaker,
    val email: String,
    val kamereonAccountId: String,
    /** Image de la voiture chez le constructeur (affichée par la montre), vide si absente. */
    val imageUrl: String = "",
)

data class UserAccount(val cars: List<UserCar>) {
    /** Voiture d'un widget : celle qui y est configurée, sinon la première. */
    fun carFor(configuredVin: String?): UserCar? =
        cars.firstOrNull { it.vin == configuredVin } ?: cars.firstOrNull()
}

data class AppPreferences(
    val displayMiles: Boolean = false,
    val convertToMiles: Boolean = false,
)
