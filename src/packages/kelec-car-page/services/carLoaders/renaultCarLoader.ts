import ApiHandler from "../../../../lib/clients/apiHandlers/apiHandler";
import RenaultAccount from "../../../../lib/clients/accounts/renaultAccount";
import { CarDataLoader, LoadContext, RemoteResult } from "../../types/carLoader";
import ChargesStorageController from "../../../../lib/storage/chargesHandler";
import { getNativeBatteryStatus } from "../../../../lib/storage/sharedPlatformsData";
import { CarMakerClientErrors } from "../../../../lib/clients/carMakers/carMakerClient";
import RenaultCharge from "../../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import { CarFetchStatus } from "../../../../lib/clients/accounts/account";
import { RenaultCarLoaderDeps } from "../../types/carLoaderDeps";

/**
 * Tous les blocs "1 clé de cache <-> 1 appel API <-> 1 setter" du handler.
 * Ajouter une donnée = ajouter une ligne ici, plus rien d'autre.
 */
type Slot = {
    storageKey: string;
    apply: (handler: ApiHandler, payload: CarFetchStatus) => void;
    fetch: (account: RenaultAccount, vin: string) => Promise<CarFetchStatus>;
};

const SLOTS: Slot[] = [
    {
        storageKey: 'cockpitStatus',
        apply: (h, p) => h.setCockpitStatus?.(p),
        fetch: (a, vin) => a.fetchCarCockpit(vin),
    },
    {
        storageKey: 'locationStatus',
        apply: (h, p) => h.setLocationStatus?.(p),
        fetch: (a, vin) => a.fetchLocationStatus(vin),
    },
    {
        storageKey: 'chargesSettings',
        apply: (h, p) => h.setChargingSettings?.(p),
        fetch: (a, vin) => a.fetchChargesSettings(vin),
    },
    {
        storageKey: 'hvacStatus',
        apply: (h, p) => h.setHVACStatus?.(p),
        fetch: (a, vin) => a.fetchHVACStatus(vin),
    },
];

/** Bug connu des Zoe 1re génération : chargingStatus == -1.1 alors que la voiture charge. */
function fixFirstGenZoeChargingStatus(payload: CarFetchStatus): CarFetchStatus {
    if (payload.apiData?.chargingStatus === -1.1 && payload.apiData?.batteryLevel < 100) {
        payload.apiData.chargingStatus = 1.0;
    }
    return payload;
}

export class RenaultCarLoader implements CarDataLoader {
    constructor(private readonly deps: RenaultCarLoaderDeps) { }

    private get vin(): string {
        return this.deps.carModel.getVin();
    }

    /* ---------------------------------- CACHE --------------------------------- */

    async loadFromCache({ handler }: LoadContext): Promise<void> {
        const { storageHandler } = this.deps;

        const battery = await storageHandler.getStoredApiData(this.vin);
        if (battery) {
            handler.setApiData(fixFirstGenZoeChargingStatus(battery));
        }
        await this.applyWidgetBattery(handler);

        await Promise.all(
            SLOTS.map(async slot => {
                const cached = await storageHandler.getStoredApiData(this.vin, slot.storageKey);
                if (cached) slot.apply(handler, cached);
            }),
        );

        const charges = await ChargesStorageController.getCharges(this.vin);
        if (charges) {
            handler.setChargesHistory?.({ hasError: false, apiData: charges });
        }
    }

    /** Le widget natif peut avoir une donnée batterie plus fraîche que le cache JS. */
    private async applyWidgetBattery(handler: ApiHandler): Promise<void> {
        try {
            const raw = await getNativeBatteryStatus(this.vin);
            if (!raw) return;

            const widgetData = JSON.parse(raw);
            if (handler.getLastUpdateDate() >= new Date(widgetData.timestamp)) return;

            handler.setApiData({ hasError: false, apiData: widgetData });
        } catch (error) {
            console.error(`Error loading widget data for car ${this.vin}: `, error);
        }
    }

    /* --------------------------------- RÉSEAU --------------------------------- */

    async loadFromNetwork(ctx: LoadContext): Promise<RemoteResult> {
        const batteryResult = await this.loadBattery(ctx);
        if (batteryResult.status !== 'ok') {
            // Sans batterie, le reste n'a pas d'intérêt : on remonte l'erreur / le TFA.
            return batteryResult;
        }

        await Promise.all([this.loadSlots(ctx), this.loadCharges(ctx)]);
        return { status: 'ok' };
    }

    private async loadBattery({ handler, notify }: LoadContext): Promise<RemoteResult> {
        const data = await this.deps.account.fetchCarStatus(this.vin);

        if (data.hasError) {
            const message = data.errorMessage ?? '';
            return message === CarMakerClientErrors.PENDING_TFA
                ? { status: 'tfa', regToken: data.regToken ?? '' }
                : { status: 'error', message };
        }

        handler.setApiData(fixFirstGenZoeChargingStatus(data));
        await this.deps.storageHandler.storeApiData(data, this.vin);
        notify();
        return { status: 'ok' };
    }

    private async loadSlots({ handler, notify }: LoadContext): Promise<void> {
        const { account, storageHandler } = this.deps;

        await Promise.all(
            SLOTS.map(async slot => {
                const payload = await slot.fetch(account, this.vin);
                if (payload.hasError) return;

                slot.apply(handler, payload);
                await storageHandler.storeApiData(payload, this.vin, slot.storageKey);
            }),
        );
        notify();
    }

    /** Historique de charge + sessions V2G : même store, donc séquentiel. */
    private async loadCharges({ handler, notify }: LoadContext): Promise<void> {
        const { account, storageHandler } = this.deps;
        const fetched = await account.fetchChargesHistory(this.vin);
        if (!fetched.hasError) {
            const charges = storageHandler.buildCharges(fetched.apiData);
            const merged = await ChargesStorageController.saveNewCharges(this.vin, charges);
            handler.setChargesHistory?.({ hasError: false, apiData: merged });
        }

        const carType = await storageHandler.getCarType(this.vin);
        if (carType?.getSupportsV2G()) {
            const sessions = await account.fetchV2GSessions(this.vin);
            if (sessions !== null) {
                const converted = RenaultCharge.convertV2GSessionsToCharges(sessions);
                const merged = await ChargesStorageController.saveNewCharges(this.vin, converted);
                handler.setChargesHistory?.({ hasError: false, apiData: merged });
            }
        }
        notify();
    }
}