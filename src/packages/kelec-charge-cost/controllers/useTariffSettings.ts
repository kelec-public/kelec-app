import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { TariffSettings } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";

/**
 * Tarifs enregistrés, relus chaque fois que l'écran reprend le focus (ex. au retour des pages des tarifs).
 * `null` pendant la première lecture.
 */
export function useTariffSettings() {
    const [settings, setSettings] = useState<TariffSettings | null>(null);

    useFocusEffect(useCallback(() => {
        let isActive = true;
        TariffRepository.get().then(loaded => { if (isActive) setSettings(loaded); });
        return () => { isActive = false; };
    }, []));

    return [settings, setSettings] as const;
}
