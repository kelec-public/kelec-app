import { useEffect, useState } from "react";
import { Currency } from "../models/Tariff";
import { parseChargingLoss } from "../models/tariffDraft";
import { TariffRepository } from "../services/tariffRepository";
import { useTariffSettings } from "./useTariffSettings";

/**
 * Page des tarifs d'une voiture : mise à jour à chaque enregistrement (au retour de la saisie d'un tarif),
 * choix de la devise et pertes à la recharge (enregistrées à chaque saisie valide).
 */
export function useTariffList(vin: string) {
    const [settings, setSettings] = useTariffSettings(vin);
    const [chargingLossText, setChargingLossText] = useState<string | null>(null);

    // texte repris des pertes enregistrées à la première lecture ; ensuite, la saisie reste telle quelle (« 10, » en cours de frappe)
    const isLoaded = settings !== null;
    useEffect(() => {
        if (!isLoaded) return setChargingLossText(null);
        setChargingLossText(current => current ?? (settings.chargingLoss ? String(settings.chargingLoss) : ''));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]);

    const isChargingLossValid = chargingLossText === null || parseChargingLoss(chargingLossText) !== null;

    const changeChargingLoss = async (text: string) => {
        setChargingLossText(text);
        const chargingLoss = parseChargingLoss(text);
        if (!settings || chargingLoss === null) return;
        const next = { ...settings, chargingLoss };
        await TariffRepository.save(vin, next);
    };

    const setCurrency = async (currency: Currency) => {
        if (!settings) return;
        const next = { ...settings, currency };
        await TariffRepository.save(vin, next);
        setSettings(next);
    };

    return {
        settings,
        setCurrency,
        chargingLossText: chargingLossText ?? '',
        isChargingLossValid,
        changeChargingLoss,
    };
}
