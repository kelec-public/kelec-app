import AsyncStorage from "@react-native-async-storage/async-storage";

/** Accès AsyncStorage aux données globales de l'app (non liées à une voiture). */
export const AppStorage = {
    async getString(key: string): Promise<string | null> {
        return AsyncStorage.getItem(key);
    },

    async setString(key: string, value: string): Promise<void> {
        await AsyncStorage.setItem(key, value);
    },

    async getJSON<T>(key: string): Promise<T | null> {
        const raw = await AsyncStorage.getItem(key);
        return raw === null ? null : JSON.parse(raw) as T;
    },

    async setJSON(key: string, value: unknown): Promise<void> {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    },

    /** Efface tout le stockage local de l'app. */
    async clearAll(): Promise<void> {
        await AsyncStorage.clear();
    },
};
