import Account, { CarFetchStatus } from "../../../../lib/clients/accounts/account";
import { HVACStatus } from "../../../../lib/clients/carMakers/renaultClient";
import { HVACStatusEnum } from "../../../../lib/clients/carMakers/renaultEnums";
import { VinStorage } from "../../../kelec-storage/vinStorage";
import { CarTypeRepository } from "../../../kelec-garage";
import HvacStatus from "../../models/HvacStatus";
import { hvacStopActions } from "../../models/hvacStopActions";
import { CommandOnlyHvacSource } from "./commandOnlyHvacSource";

/** Réponse API brute, mise en cache telle quelle. */
const CACHE_KEY = 'hvacStatus';

const toHvacStatus = (fetched: CarFetchStatus): HvacStatus => {
    const data = fetched.apiData as HVACStatus | undefined;
    return new HvacStatus(data?.hvacStatus === HVACStatusEnum.ON, data?.socThreshold ?? null);
};

export class RenaultHvacSource extends CommandOnlyHvacSource {
    readonly canStop: boolean = true;

    constructor(account: Account, private readonly vin: string) {
        super(account);
    }

    async loadCachedStatus(): Promise<HvacStatus | null> {
        const cached = await VinStorage.getJSON<CarFetchStatus>(this.vin, CACHE_KEY);
        return cached ? toHvacStatus(cached) : null;
    }

    async syncStatus(): Promise<HvacStatus | null> {
        const fetched = await this.account.fetchHVACStatus(this.vin);
        if (fetched.hasError) return null;

        await VinStorage.setJSON(this.vin, CACHE_KEY, fetched);
        return toHvacStatus(fetched);
    }

    /** L'action d'arrêt dépend du modèle : on essaie celle attendue, puis l'autre si elle est refusée. */
    async stop(): Promise<boolean> {
        const carType = await CarTypeRepository.get(this.vin);
        for (const action of hvacStopActions(carType?.getCarModel().name)) {
            if (await this.account.stopHVAC(this.vin, action)) return true;
        }
        return false;
    }
}
