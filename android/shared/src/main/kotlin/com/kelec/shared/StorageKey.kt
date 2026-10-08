package com.kelec.shared

/**
 * Toutes les clés du stockage partagé. Elles sont déjà sur les téléphones (et l'app RN en lit une partie) :
 * ne jamais en renommer une. Voir docs/native-android.md.
 */
object StorageKey {
    /** Fichier de SharedPreferences, commun au stockage en clair et au stockage chiffré. */
    const val FILE = "DATA"

    // En clair, écrit par le bridge RN
    const val ACCOUNT = "account"
    const val APP_PREFERENCES = "appPreferences"
    /** Image base64 de la voiture, affichée par les widgets 2x2 et 4x2. */
    fun carImage(vin: String) = "$vin/image"

    // En clair, écrit par le widget
    fun widgetVin(appWidgetId: Int) = "widget_vin_$appWidgetId"
    /** Ancien cache du widget (même contenu que [batteryStatus]) : seulement relu. */
    fun legacyCarData(vin: String) = "$vin/carData"
    /** Derniers jours Tempo connus (cache des widgets Tempo, propre à Android). */
    const val TEMPO = "tempo"

    // En clair, propres à la montre Wear OS
    /** VIN de la voiture affichée par les complications (même nom de clé que sur l'Apple Watch). */
    const val WATCH_WIDGET_CAR = "watchWidgetCar"
    /** Dernière température du confort thermique (« 21 »), même clé que l'app RN et l'Apple Watch. */
    fun savedTemperature(vin: String) = "$vin/savedTemperature"

    // En clair, écrit par le widget et lu par l'app RN
    const val WIDGET_LOGS = "widgetLogs"
    fun batteryStatus(vin: String) = "${vin}_batteryStatus"
    fun mileageHistory(vin: String) = "${vin}_mileageHistory"

    // Chiffré, écrit par l'app RN
    fun password(vin: String) = "${vin}_password"
    fun cookieValue(email: String) = "cookieValue_$email"
}
