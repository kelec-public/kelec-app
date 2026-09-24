import { getMileageHistory } from "../../../lib/storage/sharedPlatformsData";
import BatchedList from "../../kelec-storage/BatchedList";
import Charge, { ChargeJSON } from "../models/Charge";
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
