import { Currency } from "../../kelec-charge-cost";
import Charge from "./Charge";

/** Coût des charges affichées, avec les tarifs de la maison. */
export type ChargeCosts = {
    currency: Currency;
    /** `null` : pas de coût (session V2G sans prix saisi). */
    costOf: (charge: Charge) => number | null;
    /** Prix saisi à la main (pour une charge fusionnée : pour au moins une sous-charge). */
    isManual: (charge: Charge) => boolean;
    /** Ouvre la modification du prix d'une charge simple ; absent : pas de modification. */
    edit?: (charge: Charge) => void;
    /** Montant dans la devise des tarifs. */
    format: (amount: number) => string;
};
