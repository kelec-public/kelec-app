import { Currency } from "../../kelec-charge-cost";
import Charge from "./Charge";

/** Coût des charges affichées, avec les tarifs de la maison. */
export type ChargeCosts = {
    currency: Currency;
    /** `null` : pas de coût (session V2G). */
    costOf: (charge: Charge) => number | null;
    /** Montant dans la devise des tarifs. */
    format: (amount: number) => string;
};
