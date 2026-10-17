import Charge from "./Charge";

/** Forme stockée : un prix saisi à la main par charge, repérée par son début. */
export type ChargeCostOverrideJSON = {
    chargeStartDate: string;
    amount: number;
};

/** Même tolérance que les doublons de charges (`KnownChargeStarts`). */
const TOLERANCE_MS = 5 * 1000;

/**
 * Prix saisis à la main (charge payée ailleurs qu'à la maison…), dans la devise des tarifs.
 * Une charge est retrouvée par son début, à 5 secondes près : l'API peut renvoyer une même charge avec une seconde d'écart.
 */
class ChargeCostOverrides {
    constructor(private readonly entries: ChargeCostOverrideJSON[] = []) { }

    static fromJSON(json: ChargeCostOverrideJSON[] | null): ChargeCostOverrides {
        return new ChargeCostOverrides(json ?? []);
    }

    toJSON(): ChargeCostOverrideJSON[] {
        return this.entries;
    }

    isEmpty(): boolean {
        return this.entries.length === 0;
    }

    /** Prix saisi pour cette charge, ou `null`. */
    get(charge: Charge): number | null {
        return this.find(charge)?.amount ?? null;
    }

    /** Copie avec le prix de cette charge (remplace un éventuel prix déjà saisi). */
    with(charge: Charge, amount: number): ChargeCostOverrides {
        return new ChargeCostOverrides([
            ...this.without(charge).entries,
            { chargeStartDate: charge.getStartDate().toISOString(), amount },
        ]);
    }

    /** Copie sans prix saisi pour cette charge : elle revient au tarif. */
    without(charge: Charge): ChargeCostOverrides {
        const found = this.find(charge);
        return new ChargeCostOverrides(this.entries.filter(entry => entry !== found));
    }

    private find(charge: Charge): ChargeCostOverrideJSON | undefined {
        const start = charge.getStartDate().getTime();
        return this.entries.find(entry => Math.abs(new Date(entry.chargeStartDate).getTime() - start) <= TOLERANCE_MS);
    }
}

export default ChargeCostOverrides;
