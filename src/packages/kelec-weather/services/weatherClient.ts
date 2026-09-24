import Config from "react-native-config";
import { WeatherResponse } from "../types/weatherApi";

const API_URL = "https://api.weatherapi.com/v1";
const API_KEY = Config.WEATHER_API_KEY ?? '';

/** Météo actuelle à une position. Lève une erreur si l'API répond en erreur. */
export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    const response = await fetch(`${API_URL}/current.json?key=${API_KEY}&q=${latitude},${longitude}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}
