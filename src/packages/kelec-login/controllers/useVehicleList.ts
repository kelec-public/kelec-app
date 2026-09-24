import { useEffect, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { createLoginSource } from "../services/createLoginSource";

export type VehicleListState =
    | { status: 'loading' }
    | { status: 'error' }
    /** Voitures ajoutables (celles déjà dans le garage sont masquées). */
    | { status: 'loaded'; cars: CarModel[] };

/**
 * Voitures du compte constructeur connecté, sans celles déjà dans le garage :
 * un VIN est unique dans l'app, une voiture ne peut pas être ajoutée deux fois.
 */
export function useVehicleList(account: Account, isAlreadyAdded: (vin: string) => boolean): VehicleListState {
    const [state, setState] = useState<VehicleListState>({ status: 'loading' });

    useEffect(() => {
        if (account.getEmail() === "") return;

        let isCurrent = true;
        setState({ status: 'loading' });
        createLoginSource(account.getCarMaker()).listVehicles(account)
            .then(allCars => {
                if (isCurrent) setState({ status: 'loaded', cars: allCars.filter(car => !isAlreadyAdded(car.getVin())) });
            })
            .catch(error => {
                console.error("Error loading cars: ", error);
                if (isCurrent) setState({ status: 'error' });
            });

        return () => {
            isCurrent = false;
        };
        // isAlreadyAdded : lu au chargement de la liste, pas besoin de recharger s'il change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account]);

    return state;
}
