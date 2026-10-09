import { RenaultConnectedStatus } from "../../../lib/clients/carMakers/renaultClient";
import { VinStorage } from "../../kelec-storage/vinStorage";

const KEY = 'connectedStatus';

/**
 * Connectivité d'une voiture Renault (`connectedStatus` de la liste des véhicules), enregistrée à l'ajout de la voiture.
 * Gardée à part du compte : le JSON du compte est aussi lu par les widgets.
 */
export const ConnectedStatusRepository = {
    /** null si rien n'a été enregistré (voiture ajoutée avant, autre constructeur, ou véhicule sans connectivité). */
    async get(vin: string): Promise<RenaultConnectedStatus | null> {
        return VinStorage.getJSON<RenaultConnectedStatus>(vin, KEY);
    },

    async save(vin: string, connectedStatus: RenaultConnectedStatus): Promise<void> {
        await VinStorage.setJSON(vin, KEY, connectedStatus);
    },
};
