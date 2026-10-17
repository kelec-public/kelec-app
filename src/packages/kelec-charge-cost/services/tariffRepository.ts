import { AppStorage } from "../../kelec-storage/appStorage";
import { DEFAULT_CURRENCY, sortTariffs, TariffSettings } from "../models/Tariff";

const KEY = 'electricityTariffs';

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
        await AppStorage.setJSON(KEY, { ...settings, tariffs: sortTariffs(settings.tariffs) });
    },
};
