import Charge from "./Charge";

/** Charges regroupées par mois, avec leurs totaux. */
export type ChargeMonth = {
    monthYear: string; // clé "<mois 0-11>-<année>"
    monthNumber: number; // 0-11
    year: number;
    charges: Charge[];
    totalTimeCharged: number[]; // [heures, minutes]
    totalEnergyRecovered: number;
};

/** Un jour du mini-graphique d'un mois. */
export type ChargeMonthDay = {
    day: number; // 1-31
    hasCharge: boolean;
    hasDCCharge: boolean;
    isFuture: boolean;
};
