import CarType, { CarTypeInterface } from "../../../lib/clients/cars/carTypes/carType";
import { VinStorage } from "../../kelec-storage/vinStorage";

const KEY = 'carType';

/** Modèle technique d'une voiture (batterie, puissances, V2G…), choisi à l'ajout de la voiture. */
export const CarTypeRepository = {
    /** null si aucun modèle n'est enregistré, ou si l'entrée est incomplète (sans batterie). */
    async get(vin: string): Promise<CarType | null> {
        const stored = await VinStorage.getJSON<CarTypeInterface>(vin, KEY);
        if (stored === null || stored.battery == undefined) return null;
        return new CarType(stored);
    },

    async save(vin: string, carType: CarType): Promise<void> {
        await VinStorage.setJSON(vin, KEY, carType);
    },
};
