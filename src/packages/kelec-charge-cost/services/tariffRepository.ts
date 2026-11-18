import { AppStorage } from "../../kelec-storage/appStorage";
import { VinStorage } from "../../kelec-storage/vinStorage";
import { Currency, DEFAULT_CURRENCY, sortTariffs, Tariff, TariffSettings } from "../models/Tariff";

/**
 * Clé globale : `{ currency, tariffs }`. La devise (commune à toute l'app) y est toujours lue et écrite.
 * `tariffs` est l'ancien tarif commun à toutes les voitures : il n'est plus écrit, seulement recopié par la migration.
 */
const GLOBAL_KEY = 'electricityTariffs';
/** Tarifs d'une voiture : `<vin>/electricityTariffs`, liste de `Tariff`. */
const VEHICLE_KEY = 'electricityTariffs';
/** Pertes à la recharge d'une voiture : `<vin>/chargingLoss`, en % (texte). Absent : aucune perte. */
const CHARGING_LOSS_KEY = 'chargingLoss';
/** Marqueur posé une fois l'ancien tarif commun recopié sur les voitures du garage. */
const MIGRATED_KEY = 'electricityTariffsPerVehicle';

type GlobalJSON = {
    currency?: Currency;
    tariffs?: Tariff[];
};

/** Enregistrement des tarifs d'une voiture (la devise, elle, vaut pour toutes les voitures). */
export type TariffChange = {
    vin: string;
    settings: TariffSettings;
};

type Listener = (change: TariffChange) => void;
const listeners = new Set<Listener>();

/** Migration en cours : les lectures et écritures l'attendent. */
let migration: Promise<void> | null = null;

async function migrate(vins: string[]): Promise<void> {
    if (await AppStorage.getString(MIGRATED_KEY) !== null) return;
    const legacy = (await AppStorage.getJSON<GlobalJSON>(GLOBAL_KEY))?.tariffs ?? [];
    if (legacy.length > 0) {
        await Promise.all(vins.map(async vin => {
            if (await VinStorage.getJSON<Tariff[]>(vin, VEHICLE_KEY) === null) {
                await VinStorage.setJSON(vin, VEHICLE_KEY, sortTariffs(legacy));
            }
        }));
    }
    await AppStorage.setString(MIGRATED_KEY, 'true');
}

/** Tarifs de l'électricité et pertes à la recharge, par voiture, et devise commune à toute l'app. */
export const TariffRepository = {
    async get(vin: string): Promise<TariffSettings> {
        await migration;
        const [global, own, loss] = await Promise.all([
            AppStorage.getJSON<GlobalJSON>(GLOBAL_KEY),
            VinStorage.getJSON<Tariff[]>(vin, VEHICLE_KEY),
            VinStorage.getString(vin, CHARGING_LOSS_KEY),
        ]);
        // migration pas encore faite : la voiture garde l'ancien tarif commun
        const tariffs = own ?? (await AppStorage.getString(MIGRATED_KEY) === null ? global?.tariffs : null) ?? [];
        const chargingLoss = Number(loss);
        return {
            currency: global?.currency ?? DEFAULT_CURRENCY,
            tariffs: sortTariffs(tariffs),
            // pas de pertes : le champ reste absent
            ...(chargingLoss > 0 ? { chargingLoss } : {}),
        };
    },

    /** Enregistre les tarifs et les pertes de la voiture, et la devise (pour toutes les voitures). */
    async save(vin: string, settings: TariffSettings): Promise<void> {
        await migration;
        const { chargingLoss, ...rest } = settings;
        const sorted: TariffSettings = {
            ...rest,
            tariffs: sortTariffs(settings.tariffs),
            ...(chargingLoss ? { chargingLoss } : {}),
        };
        const global = await AppStorage.getJSON<GlobalJSON>(GLOBAL_KEY);
        await Promise.all([
            AppStorage.setJSON(GLOBAL_KEY, { ...global, currency: sorted.currency }),
            VinStorage.setJSON(vin, VEHICLE_KEY, sorted.tariffs),
            chargingLoss
                ? VinStorage.setString(vin, CHARGING_LOSS_KEY, String(chargingLoss))
                : VinStorage.remove(vin, CHARGING_LOSS_KEY),
        ]);
        listeners.forEach(listener => listener({ vin, settings: sorted }));
    },

    /**
     * Une seule fois (marqueur) : l'ancien tarif commun à toutes les voitures est recopié sur chacune des voitures données
     * qui n'a pas encore ses propres tarifs. Les voitures ajoutées ensuite démarrent sans tarif.
     * En cas d'échec, rien n'est marqué : la migration sera refaite au prochain appel.
     */
    migrateToVehicles(vins: string[]): Promise<void> {
        migration ??= migrate(vins)
            .catch(() => undefined)
            .finally(() => { migration = null; });
        return migration;
    },

    /**
     * Appelé après chaque enregistrement. Les écrans déjà ouverts ailleurs (ex. l'historique, dans l'onglet Voitures)
     * ne reprennent pas le focus quand on change d'onglet : chaque voiture a son propre `NavigationContainer`.
     * Renvoie la fonction de désabonnement.
     */
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    },
};
