import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import Charge from "../models/Charge";
import ChargesHistory from "../models/ChargesHistory";
import { createChargesSource } from "../services/createChargesSource";
import ChargeCostOverrides from "../models/ChargeCostOverrides";
import { ChargeCostOverridesRepository } from "../services/chargeCostOverridesRepository";

type ChargesHistoryController = {
    /** Indisponible (`hasError`) tant que rien n'a été chargé, ou si le constructeur n'est pas supporté. */
    history: ChargesHistory;
    /** Synchronise avec l'API. À appeler seulement après un fetch batterie réussi. */
    sync: () => Promise<void>;
    /** Ajoute des charges importées à l'historique ; null si la source ne permet pas d'importer. */
    importCharges: ((charges: Charge[]) => Promise<void>) | null;
    /** Prix saisis à la main (stockés localement, quel que soit le constructeur). */
    costOverrides: ChargeCostOverrides;
    /** Enregistre le prix saisi pour une charge, ou le retire (`null` : retour au tarif). */
    setCostOverride: (charge: Charge, amount: number | null) => Promise<void>;
};

const ChargesHistoryContext = createContext<ChargesHistoryController>({
    history: ChargesHistory.unavailable(),
    sync: async () => { },
    importCharges: null,
    costOverrides: new ChargeCostOverrides(),
    setCostOverride: async () => { },
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
 * Porte aussi les prix saisis à la main, partagés par l'historique et la page de modification du prix.
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

    const importCharges = useMemo(() => {
        const importIntoSource = source?.importCharges?.bind(source);
        if (!importIntoSource) return null;
        return async (charges: Charge[]) => {
            commit(await importIntoSource(charges));
        };
    }, [source, commit]);

    const vin = carModel.getVin();
    const [costOverrides, setCostOverrides] = useState(() => new ChargeCostOverrides());

    useEffect(() => {
        ChargeCostOverridesRepository.get(vin).then(loaded => {
            if (isMounted.current) setCostOverrides(loaded);
        });
    }, [vin]);

    const setCostOverride = useCallback(async (charge: Charge, amount: number | null) => {
        // relu avant l'écriture : le stockage fait foi
        const stored = await ChargeCostOverridesRepository.get(vin);
        const next = amount === null ? stored.without(charge) : stored.with(charge, amount);
        await ChargeCostOverridesRepository.save(vin, next);
        if (isMounted.current) setCostOverrides(next);
    }, [vin]);

    const value = useMemo(
        () => ({ history, sync, importCharges, costOverrides, setCostOverride }),
        [history, sync, importCharges, costOverrides, setCostOverride],
    );

    return (
        <ChargesHistoryContext.Provider value={value}>
            {children}
        </ChargesHistoryContext.Provider>
    );
}
