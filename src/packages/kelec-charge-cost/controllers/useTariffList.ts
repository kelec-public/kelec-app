import { Currency } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";
import { useTariffSettings } from "./useTariffSettings";

/** Page des tarifs d'une voiture : mise à jour à chaque enregistrement (au retour de la saisie d'un tarif), et choix de la devise. */
export function useTariffList(vin: string) {
    const [settings, setSettings] = useTariffSettings(vin);

    const setCurrency = async (currency: Currency) => {
        if (!settings) return;
        const next = { ...settings, currency };
        await TariffRepository.save(vin, next);
        setSettings(next);
    };

    return { settings, setCurrency };
}
