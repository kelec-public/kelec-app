import Account, { CarFetchStatus } from "../../../../lib/clients/accounts/account";
import { MapLocationStatus } from "../../../../lib/clients/carMakers/renaultClient";
import { VinStorage } from "../../../kelec-storage/vinStorage";
import { CarLocation } from "../../models/CarLocation";
import { LocationSource } from "../../types/locationSource";

/** Réponse API brute, mise en cache telle quelle. */
const CACHE_KEY = 'locationStatus';

/** Position au format de l'API Renault (aussi utilisé par les données de démo) ; null sans latitude. */
export const locationFromRenault = (data: MapLocationStatus | undefined): CarLocation | null => {
    if (data?.gpsLatitude === undefined) return null;
    return {
        latitude: data.gpsLatitude,
        longitude: data.gpsLongitude ?? 0,
        updatedAt: new Date(data.lastUpdateTime ?? 0),
    };
};

export class RenaultLocationSource implements LocationSource {
    constructor(
        private readonly account: Account,
        private readonly vin: string,
    ) { }

    async loadCached(): Promise<CarLocation | null> {
        const cached = await VinStorage.getJSON<CarFetchStatus>(this.vin, CACHE_KEY);
        return locationFromRenault(cached?.apiData);
    }

    async syncFromNetwork(): Promise<CarLocation | null> {
        const fetched = await this.account.fetchLocationStatus(this.vin);
        if (fetched.hasError) return null;

        await VinStorage.setJSON(this.vin, CACHE_KEY, fetched);
        return locationFromRenault(fetched.apiData);
    }
}
