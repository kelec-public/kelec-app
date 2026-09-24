import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMileageHistory } from "../../../lib/storage/sharedPlatformsData";
import Charge, { ChargeJSON } from "../models/Charge";
import { findMileageAtStart } from "./mileageAtStart";

/** Les charges sont stockées par lots de BATCH_SIZE sous `<vin>/chargesHistoryIndex<i>`. */
const BATCH_SIZE = 50;

const keys = {
    legacy: (vin: string) => `${vin}/chargesHistorySaved`, // ancien format : un seul blob
    amount: (vin: string) => `${vin}/chargesHistoryAmount`,
    batch: (vin: string, index: number) => `${vin}/chargesHistoryIndex${index}`,
};

/** Persistance locale de l'historique de charge d'une voiture. */
class ChargesRepository {
    /** Renvoie null si aucune charge n'a jamais été enregistrée. */
    static async getCharges(vin: string): Promise<Charge[] | null> {
        const legacy = await AsyncStorage.getItem(keys.legacy(vin));
        if (legacy !== null) {
            return Charge.fromJSONList(JSON.parse(legacy));
        }

        const amount = await AsyncStorage.getItem(keys.amount(vin));
        if (amount === null) return null;

        const batchCount = Math.ceil(parseInt(amount) / BATCH_SIZE);
        const charges: ChargeJSON[] = [];
        for (let i = 0; i < batchCount; i++) {
            const batch = await AsyncStorage.getItem(keys.batch(vin, i));
            if (batch !== null) charges.push(...JSON.parse(batch));
        }
        return Charge.fromJSONList(charges);
    }

    /**
     * Fusionne `newCharges` avec l'historique stocké (dédoublonnage sur la date de début,
     * les nouvelles charges l'emportent), complète le kilométrage, enregistre et renvoie le tout.
     */
    static async saveNewCharges(vin: string, newCharges: Charge[]): Promise<Charge[]> {
        const stored = await this.getCharges(vin) ?? [];
        const all = [...newCharges.filter(charge => charge.chargeStartDate !== undefined), ...stored];

        const seen = new Set<string | undefined>();
        const charges = all
            .filter(charge => {
                if (seen.has(charge.chargeStartDate)) return false;
                seen.add(charge.chargeStartDate);
                return true;
            })
            .sort((a, b) => a.getStartDate().getTime() - b.getStartDate().getTime());

        await this.fillMileageAtStart(vin, charges);

        await AsyncStorage.setItem(keys.amount(vin), charges.length.toString());
        for (let i = 0; i * BATCH_SIZE < charges.length; i++) {
            const batch = charges.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            await AsyncStorage.setItem(keys.batch(vin, i), JSON.stringify(batch));
        }

        if (await AsyncStorage.getItem(keys.legacy(vin)) !== null) {
            await AsyncStorage.removeItem(keys.legacy(vin));
        }

        return charges;
    }

    private static async fillMileageAtStart(vin: string, charges: Charge[]): Promise<void> {
        const mileageHistory = await getMileageHistory(vin);
        if (!mileageHistory?.length) return;

        for (const charge of charges) {
            if (charge.mileageAtStart !== undefined) continue; // déjà calculé

            const result = findMileageAtStart(charge, mileageHistory);
            if (result !== null) {
                [charge.mileageAtStart, charge.inaccurateMileage] = result;
            }
        }
    }
}

export default ChargesRepository;
