/** État de la climatisation d'une voiture. */
class HvacStatus {
    constructor(
        readonly isRunning: boolean = false,
        /** SOC minimum (%) pour pouvoir lancer la climatisation ; null si inconnu. */
        readonly minimumSoc: number | null = null,
    ) { }

    /** Statut non disponible (pas encore chargé, ou non fourni par le constructeur). */
    static unknown(): HvacStatus {
        return new HvacStatus();
    }

    /** Vrai si la batterie est sous le minimum requis, ou si ce minimum est inconnu. */
    isBelowMinimumSoc(batteryLevel: number): boolean {
        return (this.minimumSoc ?? Infinity) >= batteryLevel;
    }
}

export default HvacStatus;
