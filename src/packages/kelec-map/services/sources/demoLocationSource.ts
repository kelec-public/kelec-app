import { CarLocation } from "../../models/CarLocation";
import { LocationSource } from "../../types/locationSource";
import { locationFromRenault } from "./renaultLocationSource";

const mockData = require('../../../../assets/car_data/mockDemoData.json');

export class DemoLocationSource implements LocationSource {
    async loadCached(): Promise<CarLocation | null> {
        return locationFromRenault(mockData.map);
    }

    async syncFromNetwork(): Promise<CarLocation | null> {
        return null;
    }
}
