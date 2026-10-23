import { demoCarData } from "../../../../lib/clients/accounts/demoCars";
import { CarDataLoader, LoadContext, RemoteResult } from "../../types/carLoader";
import { CarLoaderDeps } from "../../types/carLoaderDeps";

export class DemoCarLoader implements CarDataLoader {
    constructor(private readonly deps: CarLoaderDeps) { }

    /** Données datées de maintenant : la démo est toujours « à jour » (heure de fin de charge, prochaine charge). */
    async loadFromCache({ handler }: LoadContext): Promise<void> {
        const data = demoCarData(this.deps.carModel.getVin());
        const now = new Date().toISOString();

        handler.setApiData({ hasError: false, apiData: { ...data.battery, timestamp: now } });
        handler.setCockpitStatus?.({ hasError: false, apiData: data.cockpit });
        if (data.chargesSettings) {
            handler.setChargingSettings?.({ hasError: false, apiData: { ...data.chargesSettings, dateTime: now } });
        }
    }

    async loadFromNetwork(): Promise<RemoteResult> {
        return { status: 'ok' };
    }
}
