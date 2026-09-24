import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import { parseHyundaiTime } from "../../../src/lib/clients/carMakers/hyundaiTime";
import { locationFromRenault, RenaultLocationSource } from "../../../src/packages/kelec-map/services/sources/renaultLocationSource";
import { HyundaiLocationSource } from "../../../src/packages/kelec-map/services/sources/hyundaiLocationSource";

beforeEach(async () => {
    await AsyncStorage.clear();
});

test('parseHyundaiTime', () => {
    expect(parseHyundaiTime('20240409175202').toISOString()).toBe('2024-04-09T17:52:02.000Z');
});

test('locationFromRenault : null sans latitude', () => {
    expect(locationFromRenault(undefined)).toBeNull();
    expect(locationFromRenault({ gpsLongitude: 5 })).toBeNull();
    expect(locationFromRenault({ gpsLatitude: 10.1, gpsLongitude: 5.5, lastUpdateTime: '2024-04-15T08:33:26.676Z' }))
        .toEqual({ latitude: 10.1, longitude: 5.5, updatedAt: new Date('2024-04-15T08:33:26.676Z') });
});

describe('RenaultLocationSource', () => {
    const account = new Account('email', 'password', CarMaker.RENAULT);

    test('met en cache la position récupérée (clé <vin>/locationStatus) et la relit', async () => {
        account.fetchLocationStatus = jest.fn().mockResolvedValue({
            hasError: false,
            apiData: { gpsLatitude: 1, gpsLongitude: 2, lastUpdateTime: '2024-01-01T00:00:00Z' },
        });
        const source = new RenaultLocationSource(account, 'VIN');

        expect(await source.loadCached()).toBeNull();
        expect((await source.syncFromNetwork())?.latitude).toBe(1);
        expect(await AsyncStorage.getItem('VIN/locationStatus')).not.toBeNull();
        expect((await source.loadCached())?.longitude).toBe(2);
    });

    test('renvoie null en cas d\'erreur', async () => {
        account.fetchLocationStatus = jest.fn().mockResolvedValue({ hasError: true });
        expect(await new RenaultLocationSource(account, 'VIN').syncFromNetwork()).toBeNull();
    });
});

test('HyundaiLocationSource : lit la position dans le statut de la voiture', async () => {
    const source = new HyundaiLocationSource('VIN');
    expect(await source.syncFromNetwork()).toBeNull();

    await AsyncStorage.setItem('VIN/batteryStatus', JSON.stringify({
        hasError: false,
        apiData: { vehicleLocation: { coord: { lat: 44.1, lon: 4.09 }, time: '20260924142707' } },
    }));
    expect(await source.syncFromNetwork()).toEqual({
        latitude: 44.1,
        longitude: 4.09,
        updatedAt: new Date('2026-09-24T14:27:07Z'),
    });
});
