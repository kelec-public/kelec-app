import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Currency, TariffSettings } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";

/** Page des tarifs : relue à chaque affichage (au retour de la saisie d'un tarif), et choix de la devise. */
export function useTariffList() {
    const [settings, setSettings] = useState<TariffSettings | null>(null);

    useFocusEffect(useCallback(() => {
        let isActive = true;
        TariffRepository.get().then(loaded => { if (isActive) setSettings(loaded); });
        return () => { isActive = false; };
    }, []));

    const setCurrency = async (currency: Currency) => {
        if (!settings) return;
        const next = { ...settings, currency };
        await TariffRepository.save(next);
        setSettings(next);
    };

    return { settings, setCurrency };
}
