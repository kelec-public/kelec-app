import { VinStorage } from "./vinStorage";

type BatchedListConfig = {
    /** Préfixe des clés : `<name>Amount` (nombre d'éléments) et `<name>Index<i>` (lots). */
    name: string;
    batchSize?: number;
    /** Ancienne clé où toute la liste tenait dans une seule entrée ; lue en priorité, supprimée à l'écriture. */
    legacyKey?: string;
};

/**
 * Liste JSON d'une voiture stockée en plusieurs lots, pour ne pas dépasser
 * la taille maximale d'une entrée AsyncStorage.
 */
class BatchedList<T> {
    private readonly name: string;
    private readonly batchSize: number;
    private readonly legacyKey?: string;

    constructor({ name, batchSize = 50, legacyKey }: BatchedListConfig) {
        this.name = name;
        this.batchSize = batchSize;
        this.legacyKey = legacyKey;
    }

    private get amountKey(): string {
        return `${this.name}Amount`;
    }

    private batchKey(index: number): string {
        return `${this.name}Index${index}`;
    }

    /** Renvoie null si la liste n'a jamais été enregistrée. */
    async read(vin: string): Promise<T[] | null> {
        if (this.legacyKey) {
            const legacy = await VinStorage.getJSON<T[]>(vin, this.legacyKey);
            if (legacy !== null) return legacy;
        }

        const amount = await VinStorage.getString(vin, this.amountKey);
        if (amount === null) return null;

        const items: T[] = [];
        const batchCount = Math.ceil(parseInt(amount) / this.batchSize);
        for (let i = 0; i < batchCount; i++) {
            const batch = await VinStorage.getJSON<T[]>(vin, this.batchKey(i));
            if (batch !== null) items.push(...batch);
        }
        return items;
    }

    async write(vin: string, items: T[]): Promise<void> {
        await VinStorage.setString(vin, this.amountKey, items.length.toString());
        for (let i = 0; i * this.batchSize < items.length; i++) {
            await VinStorage.setJSON(vin, this.batchKey(i), items.slice(i * this.batchSize, (i + 1) * this.batchSize));
        }

        if (this.legacyKey && await VinStorage.getString(vin, this.legacyKey) !== null) {
            await VinStorage.remove(vin, this.legacyKey);
        }
    }
}

export default BatchedList;
