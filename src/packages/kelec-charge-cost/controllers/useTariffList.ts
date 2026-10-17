import { Currency } from "../models/Tariff";
import { TariffRepository } from "../services/tariffRepository";
import { useTariffSettings } from "./useTariffSettings";

/** Page des tarifs : relue à chaque affichage (au retour de la saisie d'un tarif), et choix de la devise. */
export function useTariffList() {
    const [settings, setSettings] = useTariffSettings();

    const setCurrency = async (currency: Currency) => {
        if (!settings) return;
        const next = { ...settings, currency };
        await TariffRepository.save(next);
        setSettings(next);
    };

    return { settings, setCurrency };
}
