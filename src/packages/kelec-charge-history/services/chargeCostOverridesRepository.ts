import { VinStorage } from "../../kelec-storage/vinStorage";
import ChargeCostOverrides, { ChargeCostOverrideJSON } from "../models/ChargeCostOverrides";

const KEY = 'chargeCostOverrides';

/**
 * Prix saisis à la main, par voiture (`<vin>/chargeCostOverrides`).
 * Stockés à part des charges : une synchro remplace la charge stockée par celle de l'API, et effacerait un champ ajouté à `Charge`.
 */
export const ChargeCostOverridesRepository = {
    async get(vin: string): Promise<ChargeCostOverrides> {
        return ChargeCostOverrides.fromJSON(await VinStorage.getJSON<ChargeCostOverrideJSON[]>(vin, KEY));
    },

    async save(vin: string, overrides: ChargeCostOverrides): Promise<void> {
        await VinStorage.setJSON(vin, KEY, overrides.toJSON());
    },
};
