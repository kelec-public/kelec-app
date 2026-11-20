import { AppStorage } from "../../kelec-storage/appStorage";
import { Weather } from "../models/Weather";

const STORAGE_KEY = 'weatherCache';
/** Durée pendant laquelle une météo enregistrée est réutilisée sans appeler l'API. */
export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
/** Nombre de positions gardées (une par voiture en pratique). */
const MAX_ENTRIES = 20;

type Entry = { weather: Weather; fetchedAt: number };
type StoredCache = Record<string, Entry>;

/** Positions à moins d'environ 1 km l'une de l'autre : même entrée de cache. */
export const weatherCacheKey = (latitude: number, longitude: number): string =>
    `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

async function load(): Promise<StoredCache> {
    try {
        return await AppStorage.getJSON<StoredCache>(STORAGE_KEY) ?? {};
    } catch {
        return {};
    }
}

const isFresh = (entry: Entry, now: number) => now - entry.fetchedAt >= 0 && now - entry.fetchedAt < WEATHER_CACHE_TTL_MS;

/** Météo récente par position, pour limiter les appels à l'API (quota mensuel). */
export const WeatherCache = {
    /** Météo enregistrée à cette position il y a moins de `WEATHER_CACHE_TTL_MS`, sinon null. */
    async get(latitude: number, longitude: number, now: number = Date.now()): Promise<Weather | null> {
        const entry = (await load())[weatherCacheKey(latitude, longitude)];
        return entry && isFresh(entry, now) ? entry.weather : null;
    },

    /** Enregistre la météo à cette position et retire les entrées expirées. */
    async save(latitude: number, longitude: number, weather: Weather, now: number = Date.now()): Promise<void> {
        const cache = await load();
        cache[weatherCacheKey(latitude, longitude)] = { weather, fetchedAt: now };
        const kept = Object.entries(cache)
            .filter(([, entry]) => isFresh(entry, now))
            .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
            .slice(0, MAX_ENTRIES);
        await AppStorage.setJSON(STORAGE_KEY, Object.fromEntries(kept));
    },
};
