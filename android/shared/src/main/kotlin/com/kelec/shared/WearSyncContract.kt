package com.kelec.shared

/**
 * Synchro téléphone → montre Wear OS par la Wearable Data Layer : un seul `DataItem`, remplacé à chaque synchro
 * (la dernière valeur est livrée même si l'app de la montre est fermée, comme `updateApplicationContext` sur iOS).
 * Mêmes champs que la synchro de l'Apple Watch (`appleWatchSync.ts`), tous en JSON.
 */
object WearSyncContract {
    const val PATH = "/kelec/sync"

    /** Compte sans mot de passe (même JSON que la clé `account`). */
    const val ACCOUNT = "message"
    const val APP_PREFERENCES = "appPreferences"
    /** Sessions Renault group par email : `{email: {canLogin, cookieValue}}`. */
    const val COOKIE_VALUES = "cookieValue"
    /** Mots de passe Hyundai par VIN (non utilisés pour l'instant : Hyundai est hors périmètre sur Android). */
    const val PASSWORDS = "passwords"
    /** Change à chaque synchro, pour que la montre reçoive l'élément même si rien d'autre n'a changé. */
    const val TIMESTAMP = "timestamp"
}
