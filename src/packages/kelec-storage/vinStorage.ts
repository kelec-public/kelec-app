import AsyncStorage from "@react-native-async-storage/async-storage";

/** Clé AsyncStorage d'une donnée propre à une voiture : `<vin>/<key>`. */
export const vinKey = (vin: string, key: string): string => `${vin}/${key}`;

/** Accès AsyncStorage rangé par VIN, avec (dé)sérialisation JSON. */
export const VinStorage = {
    async getString(vin: string, key: string): Promise<string | null> {
        return AsyncStorage.getItem(vinKey(vin, key));
    },

    async setString(vin: string, key: string, value: string): Promise<void> {
        await AsyncStorage.setItem(vinKey(vin, key), value);
    },

    async getJSON<T>(vin: string, key: string): Promise<T | null> {
        const raw = await this.getString(vin, key);
        return raw === null ? null : JSON.parse(raw) as T;
    },

    async setJSON(vin: string, key: string, value: unknown): Promise<void> {
        await this.setString(vin, key, JSON.stringify(value));
    },

    async remove(vin: string, key: string): Promise<void> {
        await AsyncStorage.removeItem(vinKey(vin, key));
    },
};
