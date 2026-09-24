import { clearNativeCryptedData, getNativeCryptedData, setNativeCryptedData } from "../../../lib/storage/sharedPlatformsData";

/**
 * Clé du mot de passe dans le stockage chiffré natif (trousseau iOS / stockage chiffré Android).
 * NE PAS MODIFIER : les widgets iOS et Android et l'intent Siri lisent `<vin>_password`.
 */
const passwordKey = (vin: string): string => `${vin}_password`;

/** Mots de passe des comptes, rangés par VIN dans le stockage chiffré natif. */
export const PasswordVault = {
    /** null ou '' si aucun mot de passe n'est enregistré. */
    get(vin: string): Promise<string | null> {
        return getNativeCryptedData(passwordKey(vin));
    },

    save(vin: string, password: string): Promise<void> {
        return setNativeCryptedData(passwordKey(vin), password);
    },

    clear(vin: string): Promise<void> {
        return clearNativeCryptedData(passwordKey(vin));
    },
};
