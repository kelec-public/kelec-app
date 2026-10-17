import { useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import { parsePrice, useTariffSettings } from "../../kelec-charge-cost";
import Charge from "../models/Charge";
import { chargeCost } from "../services/chargeCost";
import { useChargesHistory } from "./ChargesHistoryProvider";

/** Même tolérance que `KnownChargeStarts` : la charge a pu être resynchronisée avec une seconde d'écart. */
const TOLERANCE_MS = 5 * 1000;

/**
 * Page de modification du prix d'une charge (charge simple, ou sous-charge d'une charge fusionnée).
 * `onDone` est appelé après l'enregistrement ou le retour au tarif.
 */
export function useChargeCostEditor(chargeStartDate: string, onDone: () => void) {
    const { languageHandler } = useContext(MainContext);
    const { history, costOverrides, setCostOverride } = useChargesHistory();
    const [tariffSettings] = useTariffSettings();

    const charge = useMemo(() => {
        const start = new Date(chargeStartDate).getTime();
        return history.getCharges().find(other => Math.abs(other.getStartDate().getTime() - start) <= TOLERANCE_MS) ?? null;
    }, [history, chargeStartDate]);

    const manualCost = charge && costOverrides.get(charge);
    const [amount, setAmount] = useState(manualCost === null || manualCost === undefined ? '' : String(manualCost));

    // prix avec le tarif seul, pour comparer
    const tariffCost = charge && tariffSettings ? chargeCost(charge, tariffSettings.tariffs) : null;

    const save = async () => {
        if (!charge) return;
        const parsed = parsePrice(amount);
        if (parsed === null) {
            Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("invalidPrice"));
            return;
        }
        await setCostOverride(charge, parsed);
        onDone();
    };

    const resetToTariff = async () => {
        if (!charge) return;
        await setCostOverride(charge, null);
        onDone();
    };

    return {
        charge: charge as Charge | null,
        currency: tariffSettings?.currency ?? null,
        amount,
        setAmount,
        /** Prix au kWh du montant saisi, ou `null` s'il n'est pas valide. */
        pricePerKwh: perKwh(parsePrice(amount), charge),
        tariffCost,
        isManual: manualCost !== null && manualCost !== undefined,
        save,
        resetToTariff,
    };
}

function perKwh(amount: number | null, charge: Charge | null): number | null {
    if (amount === null || !charge || charge.getEnergyRecovered() <= 0) return null;
    return amount / charge.getEnergyRecovered();
}
