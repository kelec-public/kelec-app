import { DEMO_VINS } from "../../src/lib/clients/accounts/demoCars";
import CarModel from "../../src/lib/clients/cars/carModel";
import { CarMaker } from "../../src/lib/clients/accounts/account";
import DemoAccount from "../../src/lib/clients/accounts/demoAccount";
import RenaultApiHandler from "../../src/lib/clients/apiHandlers/renaultApiHandler";
import StorageHandler from "../../src/lib/storage/storageHandler";
import Charge from "../../src/packages/kelec-charge-history/models/Charge";
import { DemoChargesSource } from "../../src/packages/kelec-charge-history/services/sources/demoChargesSource";
import { DemoCarLoader } from "../../src/packages/kelec-car-page/services/carLoaders/demoCarLoader";
import { DemoLocationSource } from "../../src/packages/kelec-map/services/sources/demoLocationSource";

const loadCar = async (vin: string): Promise<RenaultApiHandler> => {
    const carModel = new CarModel(vin, 'Demo', '', CarMaker.DEMO);
    const loader = new DemoCarLoader({
        carModel,
        account: new DemoAccount('demo', 'demo', CarMaker.DEMO, carModel),
        storageHandler: new StorageHandler(),
    });
    const handler = new RenaultApiHandler();
    await loader.loadFromCache({ handler, notify: () => { } });
    return handler;
};

test('démo : voiture en charge classique, datée de maintenant', async () => {
    const handler = await loadCar(DEMO_VINS.classic);
    expect(handler.getIsCarPlugged()).toBe(true);
    expect(handler.getChargeText()).toBe('charging');
    expect(handler.getIsCarICE()).toBe(false);
    expect(Date.now() - handler.getLastUpdateDate().getTime()).toBeLessThan(60_000);
});

test('démo : voiture en V2G', async () => {
    const handler = await loadCar(DEMO_VINS.v2g);
    expect(handler.getIsCarPlugged()).toBe(true);
    expect(handler.getIsV2GOrV2L()).toBe(true);
    expect(handler.getChargeText()).toBe('V2G');
});

test('démo : hybride rechargeable avec une charge programmée', async () => {
    const handler = await loadCar(DEMO_VINS.hybrid);
    expect(handler.getIsCarICE()).toBe(true);
    expect(handler.getChargeText()).toBe('scheduledCharge');
    expect(handler.shouldDisplayNextChargeSettings()).toBe(true);
});

test('démo : VIN inconnu -> voiture classique', async () => {
    const handler = await loadCar('inconnu');
    expect(handler.getChargeText()).toBe('charging');
});

test('démo : historique avec sessions V2G pour la voiture V2G seulement', async () => {
    const v2g = await new DemoChargesSource(DEMO_VINS.v2g).loadCached();
    const classic = await new DemoChargesSource(DEMO_VINS.classic).loadCached();

    expect(v2g!.some(charge => charge.isV2G && charge.getV2GEnergyDischarged() > 0)).toBe(true);
    expect(v2g!.some(charge => !charge.isV2G)).toBe(true);
    expect(classic!.some(charge => charge.isV2G)).toBe(false);
    // triées par date
    const starts = v2g!.map(charge => charge.getStartDate().getTime());
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
});

test('démo : import gardé en mémoire, sans doublon, pour la seule voiture concernée', async () => {
    const source = new DemoChargesSource(DEMO_VINS.hybrid);
    const before = (await source.loadCached())!;
    const imported = new Charge('2025-01-10T20:00:00Z', '2025-01-10T23:00:00Z', 180, 20, 100, 9, 'ok');
    const duplicate = new Charge(before[0].chargeStartDate, before[0].chargeEndDate, 1, 0, 1, 1, 'ok');

    const after = await source.importCharges([imported, duplicate]);

    expect(after).toHaveLength(before.length + 1);
    expect(after.find(charge => charge.chargeStartDate === before[0].chargeStartDate)?.getEnergyRecovered())
        .toBe(before[0].getEnergyRecovered());
    expect(await new DemoChargesSource(DEMO_VINS.hybrid).loadCached()).toHaveLength(before.length + 1);
    expect((await new DemoChargesSource(DEMO_VINS.classic).loadCached())!
        .some(charge => charge.chargeStartDate === imported.chargeStartDate)).toBe(false);
});

test('démo : position à Paris, datée de maintenant', async () => {
    const location = await new DemoLocationSource(DEMO_VINS.classic).loadCached();
    expect(location!.latitude).toBeCloseTo(48.85, 1);
    expect(location!.longitude).toBeCloseTo(2.35, 1);
    expect(Date.now() - location!.updatedAt.getTime()).toBeLessThan(60_000);
});
