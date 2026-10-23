import { demoCarData } from "../../../../lib/clients/accounts/demoCars";
import Charge from "../../models/Charge";
import { ChargesSource } from "../../types/chargesSource";
import { uniqueSortedCharges } from "../chargesRepository";

/** Charges importées en démo, par VIN : gardées en mémoire seulement, perdues au redémarrage de l'app. */
const importedCharges = new Map<string, Charge[]>();

export class DemoChargesSource implements ChargesSource {
    constructor(private readonly vin: string) { }

    async loadCached(): Promise<Charge[] | null> {
        return this.charges();
    }

    async syncFromNetwork(): Promise<Charge[] | null> {
        return null;
    }

    /** Comme pour les autres sources, une charge déjà présente l'emporte sur celle importée. */
    async importCharges(charges: Charge[]): Promise<Charge[]> {
        importedCharges.set(this.vin, [...(importedCharges.get(this.vin) ?? []), ...charges]);
        return this.charges();
    }

    private charges(): Charge[] {
        const data = demoCarData(this.vin);
        return uniqueSortedCharges([
            ...Charge.fromJSONList(data.charges),
            ...Charge.fromV2GSessions(data.v2gSessions ?? []),
            ...(importedCharges.get(this.vin) ?? []),
        ]);
    }
}
