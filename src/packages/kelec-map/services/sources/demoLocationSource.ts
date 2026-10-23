import { demoCarData } from "../../../../lib/clients/accounts/demoCars";
import { CarLocation } from "../../models/CarLocation";
import { LocationSource } from "../../types/locationSource";
import { locationFromRenault } from "./renaultLocationSource";

export class DemoLocationSource implements LocationSource {
    constructor(private readonly vin: string) { }

    async loadCached(): Promise<CarLocation | null> {
        return locationFromRenault({ ...demoCarData(this.vin).map, lastUpdateTime: new Date().toISOString() });
    }

    async syncFromNetwork(): Promise<CarLocation | null> {
        return null;
    }
}
