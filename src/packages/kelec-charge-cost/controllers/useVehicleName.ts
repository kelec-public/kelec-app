import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { carLabel, findCar } from "../../kelec-garage";

/** Nom de la voiture dont on affiche les tarifs (« modèle · plaque »), ou `undefined` si elle n'est plus dans le garage. */
export function useVehicleName(vin: string): string | undefined {
    const { currentUser } = useContext(MainContext);
    const car = findCar(currentUser, vin);
    return car && carLabel(car);
}
