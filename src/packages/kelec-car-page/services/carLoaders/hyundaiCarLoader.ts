import { CarDataLoader, LoadContext, RemoteResult } from "../../types/carLoader";
import { HyundaiCarLoaderDeps } from "../../types/carLoaderDeps";
import { CarStatusCache } from "../carStatusCache";

export class HyundaiCarLoader implements CarDataLoader {
    constructor(private readonly deps: HyundaiCarLoaderDeps) { }

    private get vin(): string {
        return this.deps.carModel.getVin();
    }

    async loadFromCache({ handler }: LoadContext): Promise<void> {
        const cached = await CarStatusCache.getHyundaiStatus(this.vin);
        if (cached) {
            handler.setApiData(cached);
        }
    }

    async loadFromNetwork({ handler, notify }: LoadContext): Promise<RemoteResult> {
        const data = await this.deps.account.fetchCarStatus(this.vin);
        if (data.hasError) {
            return { status: 'error', message: '' };
        }

        handler.setApiData(data);
        await CarStatusCache.saveHyundaiStatus(this.vin, data);
        notify();
        return { status: 'ok' };
    }
}