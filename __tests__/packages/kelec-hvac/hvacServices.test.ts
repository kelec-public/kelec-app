import AsyncStorage from "@react-native-async-storage/async-storage";
import HvacStatus from "../../../src/packages/kelec-hvac/models/HvacStatus";
import { getTemperatureLabel, stepTemperature } from "../../../src/packages/kelec-hvac/models/Temperature";
import { TemperaturePreferences } from "../../../src/packages/kelec-hvac/services/temperaturePreferences";
import { RenaultHvacSource } from "../../../src/packages/kelec-hvac/services/sources/renaultHvacSource";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe('Temperature', () => {
    test('libellés LOW / HIGH aux bornes', () => {
        expect(getTemperatureLabel(17)).toBe('LOW');
        expect(getTemperatureLabel(21)).toBe('21');
        expect(getTemperatureLabel(27)).toBe('HIGH');
    });

    test('stepTemperature reste dans la plage', () => {
        expect(stepTemperature(21, 1)).toBe(22);
        expect(stepTemperature(17, -1)).toBe(17);
        expect(stepTemperature(27, 1)).toBe(27);
    });
});

describe('HvacStatus', () => {
    test('isBelowMinimumSoc', () => {
        expect(new HvacStatus(false, 30).isBelowMinimumSoc(25)).toBe(true);
        expect(new HvacStatus(false, 30).isBelowMinimumSoc(80)).toBe(false);
        expect(HvacStatus.unknown().isBelowMinimumSoc(100)).toBe(true); // minimum inconnu
    });
});

describe('TemperaturePreferences', () => {
    test('21°C par défaut, puis la dernière valeur enregistrée', async () => {
        expect(await TemperaturePreferences.get('VIN')).toBe(21);

        await TemperaturePreferences.set('VIN', 22);
        expect(await AsyncStorage.getItem('VIN/savedTemperature')).toBe('22');
        expect(await TemperaturePreferences.get('VIN')).toBe(22);
    });

    test('ignore une valeur hors de la plage proposée', async () => {
        await AsyncStorage.setItem('VIN/savedTemperature', '35');
        expect(await TemperaturePreferences.get('VIN')).toBe(21);
    });
});

describe('RenaultHvacSource', () => {
    const account = new Account('email', 'password', CarMaker.RENAULT);

    test('met en cache le statut récupéré et le relit', async () => {
        account.fetchHVACStatus = jest.fn().mockResolvedValue({
            hasError: false,
            apiData: { hvacStatus: 'on', socThreshold: 20 },
        });
        const source = new RenaultHvacSource(account, 'VIN');

        expect(await source.loadCachedStatus()).toBeNull();
        expect(await source.syncStatus()).toEqual(new HvacStatus(true, 20));
        expect(await source.loadCachedStatus()).toEqual(new HvacStatus(true, 20));
    });

    test('renvoie null et ne touche pas au cache en cas d\'erreur', async () => {
        account.fetchHVACStatus = jest.fn().mockResolvedValue({ hasError: true });
        const source = new RenaultHvacSource(account, 'VIN');

        expect(await source.syncStatus()).toBeNull();
        expect(await source.loadCachedStatus()).toBeNull();
    });
});
