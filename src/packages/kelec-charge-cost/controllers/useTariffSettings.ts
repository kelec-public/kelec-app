import { useEffect, useState } from "react";
import { TariffSettings } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";

/**
 * Tarifs enregistrés : lus au premier affichage, puis mis à jour à chaque enregistrement (`TariffRepository.subscribe`),
 * y compris depuis un autre onglet. `null` pendant la première lecture.
 */
export function useTariffSettings() {
    const [settings, setSettings] = useState<TariffSettings | null>(null);

    useEffect(() => {
        let isActive = true;
        TariffRepository.get().then(loaded => { if (isActive) setSettings(loaded); });
        const unsubscribe = TariffRepository.subscribe(setSettings);
        return () => {
            isActive = false;
            unsubscribe();
        };
    }, []);

    return [settings, setSettings] as const;
}
