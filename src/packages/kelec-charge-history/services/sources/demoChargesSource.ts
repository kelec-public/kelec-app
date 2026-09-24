import Charge from "../../models/Charge";
import { ChargesSource } from "../../types/chargesSource";

const mockData = require('../../../../assets/car_data/mockDemoData.json');

export class DemoChargesSource implements ChargesSource {
    async loadCached(): Promise<Charge[] | null> {
        return Charge.fromJSONList(mockData.charges);
    }

    async syncFromNetwork(): Promise<Charge[] | null> {
        return null;
    }
}
