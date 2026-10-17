import { useMemo } from "react";
import { formatPrice, TariffSettings } from "../../kelec-charge-cost";
import { chargeCost } from "../services/chargeCost";
import { ChargeCosts } from "../models/ChargeCosts";

/** Coût des charges avec les tarifs donnés ; `null` tant qu'ils ne sont pas lus, ou s'il n'y en a aucun. */
export function useChargeCosts(settings: TariffSettings | null): ChargeCosts | null {
    return useMemo(() => {
        if (!settings || settings.tariffs.length === 0) return null;
        return {
            currency: settings.currency,
            costOf: charge => chargeCost(charge, settings.tariffs),
            format: amount => formatPrice(amount, settings.currency),
        };
    }, [settings]);
}
