import HyundaiAccount from "../../../../lib/clients/accounts/hyundaiAccount";
import { CarDataLoader, CarLoaderDeps, LoadContext, RemoteResult } from "../../types/carLoader";

export class HyundaiCarLoader implements CarDataLoader {
    constructor(private readonly deps: CarLoaderDeps) { }

    private get vin(): string {
        return this.deps.carModel.getVin();
    }

    async loadFromCache({ handler }: LoadContext): Promise<void> {
        const cached = await this.deps.storageHandler.getStoredApiData(this.vin);
        if (cached) {
            handler.setApiData(cached);
        }
    }

    async loadFromNetwork({ handler, notify }: LoadContext): Promise<RemoteResult> {
        const hyundaiAccount = this.deps.account as any as HyundaiAccount;
        const data = await hyundaiAccount.fetchCarStatus(this.vin);
        if (data.hasError) {
            return { status: 'error', message: '' };
        }

        handler.setApiData(data);
        await this.deps.storageHandler.storeApiData(data, this.vin);
        notify();
        return { status: 'ok' };
    }
}