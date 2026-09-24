import { CarFetchStatus } from "../../../lib/clients/accounts/account";
import { HyundaiStatus } from "../../../lib/clients/carMakers/hyundaiClient";
import { VinStorage } from "../../kelec-storage/vinStorage";

/** Même clé que `storageHandler.storeApiData` par défaut (encore utilisé par le loader Renault). */
const CAR_STATUS_KEY = 'batteryStatus';

/**
 * Dernière réponse de statut de la voiture, enregistrée par le car loader.
 * Seul point d'accès à cette donnée pour les autres packages.
 */
export const CarStatusCache = {
    async getHyundaiStatus(vin: string): Promise<HyundaiStatus | null> {
        return VinStorage.getJSON<HyundaiStatus>(vin, CAR_STATUS_KEY);
    },

    async saveHyundaiStatus(vin: string, status: CarFetchStatus): Promise<void> {
        await VinStorage.setJSON(vin, CAR_STATUS_KEY, status);
    },
};
