enum HVACStatusEnum {
    ON = 'on',
    OFF = 'off',
}

/**
 * Action qui arrête la climatisation. Selon le modèle, l'API attend « stop » ou « cancel »
 * sur le même endpoint que le lancement (voir renault-api, `set_ac_stop`).
 */
enum HvacStopAction {
    STOP = 'stop',
    CANCEL = 'cancel',
}

export { HVACStatusEnum, HvacStopAction };