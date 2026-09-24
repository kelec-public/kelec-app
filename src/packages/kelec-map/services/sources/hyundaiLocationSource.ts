import { parseHyundaiTime } from "../../../../lib/clients/carMakers/hyundaiTime";
import { CarStatusCache } from "../../../kelec-car-page";
import { CarLocation } from "../../models/CarLocation";
import { LocationSource } from "../../types/locationSource";

/**
 * Hyundai : la position fait partie de la réponse de statut de la voiture, déjà récupérée
 * (et mise en cache) par le car loader pour la batterie.
 */
export class HyundaiLocationSource implements LocationSource {
    constructor(private readonly vin: string) { }

    async loadCached(): Promise<CarLocation | null> {
        const status = await CarStatusCache.getHyundaiStatus(this.vin);
        const location = status?.apiData?.vehicleLocation;
        if (location?.coord.lat === undefined) return null;
        return {
            latitude: location.coord.lat,
            longitude: location.coord.lon ?? 0,
            updatedAt: parseHyundaiTime(location.time ?? ''),
        };
    }

    /** Appelé après un fetch batterie réussi : le cache contient déjà la réponse à jour. */
    syncFromNetwork(): Promise<CarLocation | null> {
        return this.loadCached();
    }
}
