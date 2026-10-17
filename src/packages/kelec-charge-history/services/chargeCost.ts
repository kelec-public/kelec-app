import { computeCost, Tariff } from "../../kelec-charge-cost";
import Charge from "../models/Charge";
import ChargeCostOverrides from "../models/ChargeCostOverrides";

/**
 * Coût d'une charge, ou `null` s'il n'est pas connu.
 * - Prix saisi à la main : il l'emporte sur le tarif.
 * - Session V2G : pas de coût (l'énergie renvoyée au réseau n'est pas valorisée), sauf prix saisi.
 * - Charge fusionnée : somme du coût de ses sous-charges, chacune avec son prix saisi ou à ses propres horaires.
 *   (Elle commence comme sa première sous-charge : on ne cherche donc pas de prix saisi pour elle-même.)
 */
export function chargeCost(charge: Charge, tariffs: Tariff[], overrides = new ChargeCostOverrides()): number | null {
    if (charge.getIsAMergeCharge() && charge.getSubCharges().length > 0) {
        return sumCosts(charge.getSubCharges().map(subCharge => chargeCost(subCharge, tariffs, overrides)));
    }
    const manual = overrides.get(charge);
    if (manual !== null) return manual;
    if (tariffs.length === 0 || charge.isV2G) return null;
    return computeCost(charge.getStartDate(), charge.getEndDate(), charge.getEnergyRecovered(), tariffs);
}

/** Le prix de cette charge (ou d'une de ses sous-charges) a été saisi à la main. */
export function hasManualCost(charge: Charge, overrides: ChargeCostOverrides): boolean {
    if (charge.getIsAMergeCharge() && charge.getSubCharges().length > 0) {
        return charge.getSubCharges().some(subCharge => hasManualCost(subCharge, overrides));
    }
    return overrides.get(charge) !== null;
}

/** Somme des coûts connus, ou `null` si aucun ne l'est. */
export function sumCosts(costs: (number | null)[]): number | null {
    const known = costs.filter((cost): cost is number => cost !== null);
    return known.length === 0 ? null : known.reduce((total, cost) => total + cost, 0);
}
