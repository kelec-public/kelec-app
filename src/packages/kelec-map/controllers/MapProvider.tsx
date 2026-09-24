import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { WeatherState, useWeather } from "../../kelec-weather";
import { CarLocation } from "../models/CarLocation";
import { createLocationSource } from "../services/createLocationSource";

type MapController = {
    carModel: CarModel | null;
    location: CarLocation | null;
    /** Position connue et carte non masquée dans les réglages. */
    isMapVisible: boolean;
    weather: WeatherState;
    /** Synchronise la position avec l'API. À appeler seulement après un fetch batterie réussi. */
    sync: () => Promise<void>;
};

const MapContext = createContext<MapController>({
    carModel: null,
    location: null,
    isMapVisible: false,
    weather: { status: 'loading' },
    sync: async () => { },
});

export const useCarLocation = (): MapController => useContext(MapContext);

type Props = {
    readonly carModel: CarModel;
    readonly account: Account;
    readonly children: React.ReactNode;
};

/**
 * Position d'une voiture (et météo à cette position), partagée par la mini-carte et la carte plein écran.
 * Charge le cache au montage ; le réseau est déclenché de l'extérieur via `sync`.
 */
export function MapProvider({ carModel, account, children }: Props): React.JSX.Element {
    const { appPreferences } = useContext(MainContext);
    const source = useMemo(() => createLocationSource(carModel, account), [carModel, account]);

    const [location, setLocation] = useState<CarLocation | null>(null);

    const isMounted = useRef(true);
    // Le cache ne doit pas écraser une position réseau arrivée avant lui.
    const hasNetworkData = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const commit = useCallback((next: CarLocation | null) => {
        if (next !== null && isMounted.current) setLocation(next);
    }, []);

    useEffect(() => {
        hasNetworkData.current = false;
        source?.loadCached().then(cached => {
            if (!hasNetworkData.current) commit(cached);
        });
    }, [source, commit]);

    const sync = useCallback(async () => {
        if (!source) return;
        const fetched = await source.syncFromNetwork();
        if (fetched !== null) hasNetworkData.current = true;
        commit(fetched);
    }, [source, commit]);

    const isMapVisible = location !== null && !appPreferences.hideMap;
    // Pas d'appel à l'API météo tant que la carte n'est pas affichée.
    const weather = useWeather(isMapVisible ? location : null);

    const value = useMemo(
        () => ({ carModel, location, isMapVisible, weather, sync }),
        [carModel, location, isMapVisible, weather, sync],
    );

    return (
        <MapContext.Provider value={value}>
            {children}
        </MapContext.Provider>
    );
}
