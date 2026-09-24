import { WeatherResponse } from "../types/weatherApi";

/** Météo actuelle à une position. */
export type Weather = {
    temperatureC: number | null;
    iconUrl: string | null;
};

export const weatherFromResponse = (response: WeatherResponse): Weather => ({
    temperatureC: response.current?.temp_c ?? null,
    iconUrl: response.current?.condition?.icon ? `https:${response.current.condition.icon}` : null,
});

export type WeatherState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'loaded'; weather: Weather };
