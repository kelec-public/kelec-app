import { useEffect, useState } from "react";
import { TariffSettings } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";

/**
 * Tarifs de la voiture (et devise de l'app) : lus au premier affichage, puis mis à jour à chaque enregistrement
 * (`TariffRepository.subscribe`), y compris depuis un autre onglet. Un changement de devise fait depuis une autre voiture
 * est aussi repris. `null` pendant la première lecture.
 */
export function useTariffSettings(vin: string) {
    const [settings, setSettings] = useState<TariffSettings | null>(null);

    useEffect(() => {
        let isActive = true;
        setSettings(null);
        TariffRepository.get(vin).then(loaded => { if (isActive) setSettings(loaded); });
        const unsubscribe = TariffRepository.subscribe(change => {
            setSettings(current => {
                if (change.vin === vin) return change.settings;
                return current && { ...current, currency: change.settings.currency };
            });
        });
        return () => {
            isActive = false;
            unsubscribe();
        };
    }, [vin]);

    return [settings, setSettings] as const;
}
