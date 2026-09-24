import { useEffect, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { createLoginSource } from "../services/createLoginSource";

export type VehicleListState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'loaded'; cars: CarModel[] };

/** Voitures du compte constructeur connecté. */
export function useVehicleList(account: Account): VehicleListState {
    const [state, setState] = useState<VehicleListState>({ status: 'loading' });

    useEffect(() => {
        if (account.getEmail() === "") return;

        let isCurrent = true;
        setState({ status: 'loading' });
        createLoginSource(account.getCarMaker()).listVehicles(account)
            .then(cars => { if (isCurrent) setState({ status: 'loaded', cars }); })
            .catch(error => {
                console.error("Error loading cars: ", error);
                if (isCurrent) setState({ status: 'error' });
            });

        return () => {
            isCurrent = false;
        };
    }, [account]);

    return state;
}
