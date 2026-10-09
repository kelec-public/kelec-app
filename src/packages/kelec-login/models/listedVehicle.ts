import { RenaultConnectedStatus } from "../../../lib/clients/carMakers/renaultClient";
import CarModel from "../../../lib/clients/cars/carModel";

/** Une voiture proposée à l'étape 3, avec les données à enregistrer si elle est ajoutée. */
export type ListedVehicle = {
    car: CarModel;
    /** Renault uniquement, absent si l'API ne le renvoie pas. */
    connectedStatus?: RenaultConnectedStatus;
};
