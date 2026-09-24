import AsyncStorage from "@react-native-async-storage/async-storage";

/** Accès AsyncStorage aux données globales de l'app (non liées à une voiture), avec (dé)sérialisation JSON. */
export const AppStorage = {
    async getJSON<T>(key: string): Promise<T | null> {
        const raw = await AsyncStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw) as T;
    },

    async setJSON(key: string, value: unknown): Promise<void> {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    },
};
