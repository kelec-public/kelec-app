import { CarDataLoader, LoadContext, RemoteResult } from "../../types/carLoader";
import { CarLoaderDeps } from "../../types/carLoaderDeps";

const mockData = require('../../../../assets/car_data/mockDemoData.json');

export class DemoCarLoader implements CarDataLoader {
    constructor(private readonly deps: CarLoaderDeps) { }

    async loadFromCache({ handler }: LoadContext): Promise<void> {
        handler.setApiData({ hasError: false, apiData: mockData.battery });
        handler.setCockpitStatus?.({ hasError: false, apiData: mockData.cockpit });
        handler.setLocationStatus?.({ hasError: false, apiData: mockData.map });
    }

    async loadFromNetwork(): Promise<RemoteResult> {
        return { status: 'ok' };
    }
}