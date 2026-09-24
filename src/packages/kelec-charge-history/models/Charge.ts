import { formatNumberWithLeadingZero } from "../../../lib/graphics/utils";
import { V2GApiSession } from "../../../lib/clients/carMakers/renault/v2gApiResponse";

/** Forme sérialisée d'une charge (API Renault / AsyncStorage). Les noms des champs ne doivent pas changer. */
export type ChargeJSON = {
    chargeStartDate?: string;
    chargeEndDate?: string;
    chargeDuration?: number;
    chargeStartBatteryLevel?: number;
    chargeEndBatteryLevel?: number;
    chargeEnergyRecovered?: number;
    chargeEndStatus?: string;
    isAMergeCharge?: boolean;
    subCharges?: Charge[];
    mileageAtStart?: number;
    inaccurateMileage?: boolean;
    V2GEnergyDischarged?: number;
    isV2G?: boolean;
};

class Charge {
    /** Puissance moyenne (kW) à partir de laquelle une charge est considérée comme DC. */
    static readonly DC_THRESHOLD_KW = 26;

    constructor(
        public chargeStartDate?: string,
        public chargeEndDate?: string,
        public chargeDuration?: number,
        public chargeStartBatteryLevel?: number,
        public chargeEndBatteryLevel?: number,
        public chargeEnergyRecovered?: number,
        public chargeEndStatus?: string,
        public isAMergeCharge?: boolean,
        public subCharges: Charge[] = [],
        public mileageAtStart?: number, // kilométrage au début de la charge, si connu
        public inaccurateMileage?: boolean, // kilométrage approximatif à cause de l'heure de début
        public V2GEnergyDischarged?: number, // énergie renvoyée au réseau
        public isV2G: boolean = false,
    ) { }

    /* ------------------------------ CONSTRUCTION ------------------------------ */

    static fromJSON(json: ChargeJSON): Charge {
        return new Charge(
            json.chargeStartDate,
            json.chargeEndDate,
            json.chargeDuration,
            json.chargeStartBatteryLevel,
            json.chargeEndBatteryLevel,
            json.chargeEnergyRecovered,
            json.chargeEndStatus,
            json.isAMergeCharge,
            json.subCharges ?? [],
            json.mileageAtStart,
            json.inaccurateMileage,
            json.V2GEnergyDischarged,
            json.isV2G ?? false,
        );
    }

    /** Les charges sans date de début sont ignorées. */
    static fromJSONList(list: ChargeJSON[]): Charge[] {
        return list
            .filter(json => json.chargeStartDate !== undefined)
            .map(json => Charge.fromJSON(json));
    }

    static fromV2GSessions(sessions: V2GApiSession[]): Charge[] {
        return sessions.map(session => new Charge(
            session.startDateTime,
            session.endDateTime,
            Math.floor(session.totalSessionDuration / 60), // secondes -> minutes
            session.sessionStartBatteryLevel,
            session.sessionEndBatteryLevel,
            session.energyMobility,
            session.status,
            false,
            [],
            undefined,
            undefined,
            session.energyDischarged,
            true,
        ));
    }

    /* -------------------------------- GETTERS --------------------------------- */

    getStartDate(): Date {
        return new Date(this.chargeStartDate ?? Date.now());
    }

    getEndDate(): Date {
        return new Date(this.chargeEndDate ?? Date.now());
    }

    getIsSameDay(): boolean {
        return this.getStartDate().getDate() === this.getEndDate().getDate();
    }

    getEndPercentage(): number {
        return this.chargeEndBatteryLevel ?? 0;
    }

    getStartPercentage(): number {
        return this.chargeStartBatteryLevel ?? 0;
    }

    getDurationInMinutes(): number {
        return this.chargeDuration ?? 0;
    }

    getChargeLength(): string {
        if (this.isAMergeCharge) {
            // Charge fusionnée : somme des durées des sous-charges
            const totalDuration = this.getSubCharges().reduce((acc, charge) => acc + charge.getDurationInMinutes(), 0);
            const hours = Math.floor(totalDuration / 60);
            const minutes = totalDuration % 60;
            return `${hours}h${formatNumberWithLeadingZero(minutes)}`;
        }
        const start = this.getStartDate();
        start.setSeconds(0);
        const end = this.getEndDate();
        end.setSeconds(0);
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60)) - (hours * 60);
        return `${hours}h${formatNumberWithLeadingZero(minutes)}`;
    }

    getEnergyRecovered(): number {
        return this.chargeEnergyRecovered ?? 0;
    }

    /** Puissance moyenne en kW. */
    getAverageChargeSpeed(): number {
        return this.getEnergyRecovered() / (this.getDurationInMinutes() / 60);
    }

    isDCCharge(): boolean {
        return this.getAverageChargeSpeed() >= Charge.DC_THRESHOLD_KW;
    }

    getIsAMergeCharge(): boolean {
        return this.isAMergeCharge ?? false;
    }

    getSubCharges(): Charge[] {
        return this.subCharges ?? [];
    }

    getMileageAtStart(): number | undefined {
        return this.mileageAtStart;
    }

    getIsInaccurateMileage(): boolean {
        return this.inaccurateMileage ?? false;
    }

    getV2GEnergyDischarged(): number {
        return this.V2GEnergyDischarged ?? 0;
    }

    getV2GEnergyCharged(): number {
        return this.getEnergyRecovered() + this.getV2GEnergyDischarged();
    }
}

export default Charge;
