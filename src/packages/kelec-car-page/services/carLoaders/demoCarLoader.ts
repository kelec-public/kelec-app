import { CarDataLoader, CarLoaderDeps, LoadContext, RemoteResult } from "../../types/carLoader";

const mockData = require('../../../../assets/car_data/mockDemoData.json');

export class DemoCarLoader implements CarDataLoader {
    constructor(private readonly deps: CarLoaderDeps) { }

    async loadFromCache({ handler }: LoadContext): Promise<void> {
        handler.setApiData({ hasError: false, apiData: mockData.battery });
        handler.setCockpitStatus?.({ hasError: false, apiData: mockData.cockpit });
        handler.setLocationStatus?.({ hasError: false, apiData: mockData.map });
        handler.setChargesHistory?.({
            hasError: false,
            apiData: this.deps.storageHandler.buildCharges(mockData.charges),
        });
    }

    async loadFromNetwork(): Promise<RemoteResult> {
        return { status: 'ok' };
    }
}