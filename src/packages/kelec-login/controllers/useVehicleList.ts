import { useEffect, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import { ListedVehicle } from "../models/listedVehicle";
import { createLoginSource } from "../services/createLoginSource";

export type VehicleListState =
    | { status: 'loading' }
    | { status: 'error' }
    /** Voitures ajoutables (celles déjà dans le garage sont masquées). */
    | { status: 'loaded'; vehicles: ListedVehicle[] };

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
            .then(allVehicles => {
                if (isCurrent) setState({ status: 'loaded', vehicles: allVehicles.filter(vehicle => !isAlreadyAdded(vehicle.car.getVin())) });
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
