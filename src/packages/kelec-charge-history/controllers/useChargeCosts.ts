import { useMemo } from "react";
import { formatPrice, TariffSettings } from "../../kelec-charge-cost";
import Charge from "../models/Charge";
import ChargeCostOverrides from "../models/ChargeCostOverrides";
import { ChargeCosts } from "../models/ChargeCosts";
import { chargeCost, hasManualCost } from "../services/chargeCost";

/**
 * Coût des charges avec les tarifs et les prix saisis à la main.
 * `null` tant que les tarifs ne sont pas lus, ou s'il n'y a ni tarif ni prix saisi.
 */
export function useChargeCosts(
    settings: TariffSettings | null,
    overrides: ChargeCostOverrides,
    edit?: (charge: Charge) => void,
): ChargeCosts | null {
    return useMemo(() => {
        if (!settings || (settings.tariffs.length === 0 && overrides.isEmpty())) return null;
        return {
            currency: settings.currency,
            costOf: charge => chargeCost(charge, settings.tariffs, overrides),
            isManual: charge => hasManualCost(charge, overrides),
            format: amount => formatPrice(amount, settings.currency),
            edit,
        };
    }, [settings, overrides, edit]);
}
