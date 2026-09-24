import { VinStorage } from "../../kelec-storage/vinStorage";
import { DEFAULT_TEMPERATURE, TEMPERATURES } from "../models/Temperature";

const KEY = 'savedTemperature';

/** Dernière température de consigne choisie pour une voiture. */
export const TemperaturePreferences = {
    async get(vin: string): Promise<number> {
        const stored = await VinStorage.getString(vin, KEY);
        const temperature = stored === null ? NaN : parseFloat(stored);
        return TEMPERATURES.includes(temperature) ? temperature : DEFAULT_TEMPERATURE;
    },

    async set(vin: string, temperature: number): Promise<void> {
        await VinStorage.setString(vin, KEY, temperature.toString());
    },
};
