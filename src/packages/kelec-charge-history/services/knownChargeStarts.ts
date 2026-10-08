import Charge from "../models/Charge";

/**
 * Débuts des charges déjà retenues, pour écarter les doublons.
 * Deux charges dont les débuts sont à moins de `TOLERANCE_SECONDS` d'écart sont la même charge :
 * l'API Renault a renvoyé une même charge avec une seconde d'écart d'un jour à l'autre
 * (`…T07:57:41Z` puis `…T07:57:42Z`), et une date peut être écrite avec ou sans millisecondes.
 */
class KnownChargeStarts {
    static readonly TOLERANCE_SECONDS = 5;

    private readonly seconds = new Set<number>();

    constructor(charges: Charge[] = []) {
        charges.forEach(charge => this.add(charge));
    }

    has(charge: Charge): boolean {
        const start = KnownChargeStarts.startInSeconds(charge);
        for (let delta = -KnownChargeStarts.TOLERANCE_SECONDS; delta <= KnownChargeStarts.TOLERANCE_SECONDS; delta++) {
            if (this.seconds.has(start + delta)) return true;
        }
        return false;
    }

    add(charge: Charge): void {
        this.seconds.add(KnownChargeStarts.startInSeconds(charge));
    }

    private static startInSeconds(charge: Charge): number {
        return Math.round(charge.getStartDate().getTime() / 1000);
    }
}

export default KnownChargeStarts;
