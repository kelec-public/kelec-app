import Account from "../../../../lib/clients/accounts/account";
import { CarTypeRepository } from "../../../kelec-garage";
import Charge from "../../models/Charge";
import { ChargesSource } from "../../types/chargesSource";
import ChargesRepository from "../chargesRepository";

export class RenaultChargesSource implements ChargesSource {
    constructor(
        private readonly account: Account,
        private readonly vin: string,
    ) { }

    loadCached(): Promise<Charge[] | null> {
        return ChargesRepository.getCharges(this.vin);
    }

    /** Historique de charge puis sessions V2G : même stockage, donc séquentiel. */
    async syncFromNetwork(): Promise<Charge[] | null> {
        let charges: Charge[] | null = null;

        const fetched = await this.account.fetchChargesHistory(this.vin);
        if (!fetched.hasError) {
            charges = await ChargesRepository.saveNewCharges(this.vin, Charge.fromJSONList(fetched.apiData));
        }

        const carType = await CarTypeRepository.get(this.vin);
        if (carType?.getSupportsV2G()) {
            const sessions = await this.account.fetchV2GSessions(this.vin);
            if (sessions !== null) {
                charges = await ChargesRepository.saveNewCharges(this.vin, Charge.fromV2GSessions(sessions));
            }
        }
        return charges;
    }
}
