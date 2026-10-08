import { getMileageHistory } from "../../../lib/storage/sharedPlatformsData";
import BatchedList from "../../kelec-storage/BatchedList";
import Charge, { ChargeJSON } from "../models/Charge";
import KnownChargeStarts from "./knownChargeStarts";
import { findMileageAtStart } from "./mileageAtStart";

const storedCharges = new BatchedList<ChargeJSON>({
    name: 'chargesHistory',
    legacyKey: 'chargesHistorySaved',
});

/** Persistance locale de l'historique de charge d'une voiture. */
class ChargesRepository {
    /** Renvoie null si aucune charge n'a jamais été enregistrée. */
    static async getCharges(vin: string): Promise<Charge[] | null> {
        const charges = await storedCharges.read(vin);
        return charges === null ? null : Charge.fromJSONList(charges);
    }

    /**
     * Ajoute `newCharges` (venant de l'API) à l'historique stocké : en cas de doublon,
     * les nouvelles charges l'emportent. Complète le kilométrage, enregistre et renvoie le tout.
     */
    static async saveNewCharges(vin: string, newCharges: Charge[]): Promise<Charge[]> {
        const stored = await this.getCharges(vin) ?? [];
        return this.save(vin, [...newCharges, ...stored]);
    }

    /**
     * Ajoute à l'historique stocké les charges qu'il ne contient pas encore (import) :
     * en cas de doublon, la charge déjà stockée l'emporte. Enregistre et renvoie le tout.
     */
    static async addMissingCharges(vin: string, charges: Charge[]): Promise<Charge[]> {
        const stored = await this.getCharges(vin) ?? [];
        return this.save(vin, [...stored, ...charges]);
    }

    /**
     * Dédoublonne sur le début (la première occurrence l'emporte, voir `KnownChargeStarts`), trie par date,
     * complète le kilométrage puis enregistre.
     */
    private static async save(vin: string, candidates: Charge[]): Promise<Charge[]> {
        const known = new KnownChargeStarts();
        const charges = candidates
            .filter(charge => {
                if (charge.chargeStartDate === undefined) return false;
                if (known.has(charge)) return false;
                known.add(charge);
                return true;
            })
            .sort((a, b) => a.getStartDate().getTime() - b.getStartDate().getTime());

        await this.fillMileageAtStart(vin, charges);
        await storedCharges.write(vin, charges);
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
