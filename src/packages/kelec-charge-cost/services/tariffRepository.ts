import { AppStorage } from "../../kelec-storage/appStorage";
import { DEFAULT_CURRENCY, sortTariffs, TariffSettings } from "../models/Tariff";

const KEY = 'electricityTariffs';

type Listener = (settings: TariffSettings) => void;
const listeners = new Set<Listener>();

/** Tarifs de l'électricité (globaux, pas par voiture). */
export const TariffRepository = {
    async get(): Promise<TariffSettings> {
        const stored = await AppStorage.getJSON<TariffSettings>(KEY);
        return {
            currency: stored?.currency ?? DEFAULT_CURRENCY,
            tariffs: sortTariffs(stored?.tariffs ?? []),
        };
    },

    async save(settings: TariffSettings): Promise<void> {
        const sorted = { ...settings, tariffs: sortTariffs(settings.tariffs) };
        await AppStorage.setJSON(KEY, sorted);
        listeners.forEach(listener => listener(sorted));
    },

    /**
     * Appelé après chaque enregistrement. Les écrans déjà ouverts ailleurs (ex. l'historique, dans l'onglet Voitures)
     * ne reprennent pas le focus quand on change d'onglet : chaque voiture a son propre `NavigationContainer`.
     * Renvoie la fonction de désabonnement.
     */
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
};
