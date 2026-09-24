import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import HvacStatus from "../models/HvacStatus";
import { createHvacSource } from "../services/createHvacSource";

type HvacController = {
    status: HvacStatus;
    /** Synchronise le statut avec l'API. À appeler seulement après un fetch batterie réussi. */
    sync: () => Promise<void>;
    launch: (temperature: number) => Promise<boolean>;
};

const HvacContext = createContext<HvacController>({
    status: HvacStatus.unknown(),
    sync: async () => { },
    launch: async () => false,
});

export const useHvac = (): HvacController => useContext(HvacContext);

type Props = {
    readonly carModel: CarModel;
    readonly account: Account;
    readonly children: React.ReactNode;
};

/**
 * Climatisation d'une voiture : statut (cache au montage, réseau via `sync`) et commande de lancement.
 */
export function HvacProvider({ carModel, account, children }: Props): React.JSX.Element {
    const source = useMemo(() => createHvacSource(carModel, account), [carModel, account]);

    const [status, setStatus] = useState<HvacStatus>(HvacStatus.unknown);

    const isMounted = useRef(true);
    // Le cache ne doit pas écraser un statut réseau arrivé avant lui.
    const hasNetworkData = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const commit = useCallback((next: HvacStatus | null) => {
        if (next !== null && isMounted.current) setStatus(next);
    }, []);

    useEffect(() => {
        hasNetworkData.current = false;
        source.loadCachedStatus().then(cached => {
            if (!hasNetworkData.current) commit(cached);
        });
    }, [source, commit]);

    const sync = useCallback(async () => {
        const fetched = await source.syncStatus();
        if (fetched !== null) hasNetworkData.current = true;
        commit(fetched);
    }, [source, commit]);

    const launch = useCallback((temperature: number) => source.launch(temperature), [source]);

    const value = useMemo(() => ({ status, sync, launch }), [status, sync, launch]);

    return (
        <HvacContext.Provider value={value}>
            {children}
        </HvacContext.Provider>
    );
}
