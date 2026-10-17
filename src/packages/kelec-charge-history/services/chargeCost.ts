import { computeCost, Tariff } from "../../kelec-charge-cost";
import Charge from "../models/Charge";

/**
 * Coût d'une charge avec les tarifs de la maison, ou `null` s'il n'y en a pas.
 * - Session V2G : pas de coût (l'énergie renvoyée au réseau n'est pas valorisée).
 * - Charge fusionnée : somme du coût de ses sous-charges, chacune à ses propres horaires.
 */
export function chargeCost(charge: Charge, tariffs: Tariff[]): number | null {
    if (tariffs.length === 0 || charge.isV2G) return null;
    if (charge.getIsAMergeCharge() && charge.getSubCharges().length > 0) {
        return sumCosts(charge.getSubCharges().map(subCharge => chargeCost(subCharge, tariffs)));
    }
    return computeCost(charge.getStartDate(), charge.getEndDate(), charge.getEnergyRecovered(), tariffs);
}

/** Somme des coûts connus, ou `null` si aucun ne l'est. */
export function sumCosts(costs: (number | null)[]): number | null {
    const known = costs.filter((cost): cost is number => cost !== null);
    return known.length === 0 ? null : known.reduce((total, cost) => total + cost, 0);
}
