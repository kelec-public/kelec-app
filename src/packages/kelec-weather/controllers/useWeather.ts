import { useEffect, useState } from "react";
import { WeatherState, weatherFromResponse } from "../models/Weather";
import { fetchCurrentWeather } from "../services/weatherClient";

type Position = { latitude: number; longitude: number };

/** Météo à `position`, rechargée quand la position change. `position` null : aucun appel. */
export function useWeather(position: Position | null): WeatherState {
    const [state, setState] = useState<WeatherState>({ status: 'loading' });
    const latitude = position?.latitude;
    const longitude = position?.longitude;

    useEffect(() => {
        if (latitude === undefined || longitude === undefined) return;

        let isCurrent = true;
        setState({ status: 'loading' });
        fetchCurrentWeather(latitude, longitude)
            .then(response => {
                if (isCurrent) setState({ status: 'loaded', weather: weatherFromResponse(response) });
            })
            .catch(() => {
                if (isCurrent) setState({ status: 'error' });
            });

        return () => {
            isCurrent = false;
        };
    }, [latitude, longitude]);

    return state;
}
