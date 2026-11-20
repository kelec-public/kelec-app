import { useEffect, useState } from "react";
import { Weather, WeatherState, weatherFromResponse } from "../models/Weather";
import { WeatherCache } from "../services/weatherCache";
import { fetchCurrentWeather } from "../services/weatherClient";

type Position = { latitude: number; longitude: number };

/** Météo récente du cache, sinon appel à l'API puis enregistrement dans le cache. */
async function loadWeather(latitude: number, longitude: number): Promise<Weather> {
    const cached = await WeatherCache.get(latitude, longitude);
    if (cached) return cached;

    const weather = weatherFromResponse(await fetchCurrentWeather(latitude, longitude));
    WeatherCache.save(latitude, longitude, weather).catch(() => {});
    return weather;
}

/**
 * Météo à `position`, rechargée quand la position change. `position` null : aucun appel.
 * Une météo de moins de 30 min à moins d'environ 1 km est réutilisée sans appeler l'API.
 */
export function useWeather(position: Position | null): WeatherState {
    const [state, setState] = useState<WeatherState>({ status: 'loading' });
    const latitude = position?.latitude;
    const longitude = position?.longitude;

    useEffect(() => {
        if (latitude === undefined || longitude === undefined) return;

        let isCurrent = true;
        setState({ status: 'loading' });
        loadWeather(latitude, longitude)
            .then(weather => {
                if (isCurrent) setState({ status: 'loaded', weather });
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
