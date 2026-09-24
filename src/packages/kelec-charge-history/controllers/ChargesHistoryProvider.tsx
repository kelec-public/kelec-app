import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import Charge from "../models/Charge";
import ChargesHistory from "../models/ChargesHistory";
import { createChargesSource } from "../services/createChargesSource";

type ChargesHistoryController = {
    /** Indisponible (`hasError`) tant que rien n'a été chargé, ou si le constructeur n'est pas supporté. */
    history: ChargesHistory;
    /** Synchronise avec l'API. À appeler seulement après un fetch batterie réussi. */
    sync: () => Promise<void>;
};

const ChargesHistoryContext = createContext<ChargesHistoryController>({
    history: ChargesHistory.unavailable(),
    sync: async () => { },
});

export const useChargesHistory = (): ChargesHistoryController => useContext(ChargesHistoryContext);

type Props = {
    readonly carModel: CarModel;
    readonly account: Account;
    readonly children: React.ReactNode;
};

/**
 * Historique de charge d'une voiture, partagé par la page voiture et l'écran d'historique.
 * Charge le cache au montage ; le réseau est déclenché de l'extérieur via `sync`.
 */
export function ChargesHistoryProvider({ carModel, account, children }: Props): React.JSX.Element {
    const source = useMemo(
        () => createChargesSource(carModel, account),
        [carModel, account],
    );

    const [history, setHistory] = useState<ChargesHistory>(ChargesHistory.unavailable);

    const isMounted = useRef(true);
    // Le cache ne doit pas écraser des données réseau arrivées avant lui.
    const hasNetworkData = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const commit = useCallback((charges: Charge[] | null) => {
        if (charges !== null && isMounted.current) {
            setHistory(new ChargesHistory(charges));
        }
    }, []);

    useEffect(() => {
        hasNetworkData.current = false;
        source?.loadCached().then(charges => {
            if (!hasNetworkData.current) commit(charges);
        });
    }, [source, commit]);

    const sync = useCallback(async () => {
        if (!source) return;
        const charges = await source.syncFromNetwork();
        if (charges !== null) hasNetworkData.current = true;
        commit(charges);
    }, [source, commit]);

    const value = useMemo(() => ({ history, sync }), [history, sync]);

    return (
        <ChargesHistoryContext.Provider value={value}>
            {children}
        </ChargesHistoryContext.Provider>
    );
}
