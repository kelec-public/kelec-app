import { RenaultConnectedStatus } from "../../../lib/clients/carMakers/renaultClient";
import { VinStorage } from "../../kelec-storage/vinStorage";

const KEY = 'connectedStatus';
/** Date (ms) de la dernière réponse de l'API pour ce VIN, avec ou sans connectedStatus. */
const CHECKED_AT_KEY = 'connectedStatusCheckedAt';

/**
 * Connectivité d'une voiture Renault (`connectedStatus` de la liste des véhicules), enregistrée à l'ajout
 * puis rafraîchie régulièrement (`refreshConnectedStatus`).
 * Gardée à part du compte : le JSON du compte est aussi lu par les widgets.
 */
export const ConnectedStatusRepository = {
    /** null si rien n'a été enregistré (autre constructeur, véhicule sans connectivité, ou pas encore récupéré). */
    async get(vin: string): Promise<RenaultConnectedStatus | null> {
        return VinStorage.getJSON<RenaultConnectedStatus>(vin, KEY);
    },

    /** Enregistre le connectedStatus et note la date de la vérification. */
    async save(vin: string, connectedStatus: RenaultConnectedStatus, now: number = Date.now()): Promise<void> {
        await VinStorage.setJSON(vin, KEY, connectedStatus);
        await this.markChecked(vin, now);
    },

    /** Note que l'API a répondu, sans toucher au connectedStatus déjà enregistré. */
    async markChecked(vin: string, now: number = Date.now()): Promise<void> {
        await VinStorage.setString(vin, CHECKED_AT_KEY, String(now));
    },

    /** null si l'API n'a jamais répondu pour ce VIN. */
    async lastCheckedAt(vin: string): Promise<number | null> {
        const raw = await VinStorage.getString(vin, CHECKED_AT_KEY);
        const value = raw === null ? NaN : Number(raw);
        return Number.isFinite(value) ? value : null;
    },
};
