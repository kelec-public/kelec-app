import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultAccount from "../../../src/lib/clients/accounts/renaultAccount";
import HyundaiAccount from "../../../src/lib/clients/accounts/hyundaiAccount";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import CarType, { CarTypeInterface } from "../../../src/lib/clients/cars/carTypes/carType";
import * as sharedPlatformsData from "../../../src/lib/storage/sharedPlatformsData";
import { AccountRepository, CarTypeRepository, logOut } from "../../../src/packages/kelec-garage";

const renault = (vin: string, password: string) =>
    new RenaultAccount('r@x.fr', password, 'kamereonId', new CarModel(vin, 'Zoé', '', CarMaker.RENAULT), 'Jean', 'Dupont', CarMaker.RENAULT);
const hyundai = (vin: string, password: string) =>
    new HyundaiAccount('h@x.fr', password, '1234', new CarModel(vin, 'Ioniq', '', CarMaker.HYUNDAI));

let saveNativeAccount: jest.SpyInstance;

beforeEach(async () => {
    await AsyncStorage.clear();
    saveNativeAccount = jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockResolvedValue();
});

afterEach(() => {
    saveNativeAccount.mockRestore();
});

describe('AccountRepository.save', () => {
    test('mots de passe dans le stockage chiffré, jamais dans le JSON ni pour les widgets', async () => {
        const user = new UserAccount('VIN1', [renault('VIN1', 'secret-r'), hyundai('VIN2', 'secret-h')]);
        await AccountRepository.save(user);

        // stockage chiffré : clé <vin>_password (lue par les widgets et l'intent Siri)
        expect(await AsyncStorage.getItem('VIN1_password')).toBe('secret-r');
        expect(await AsyncStorage.getItem('VIN2_password')).toBe('secret-h');

        const storedJSON = await AsyncStorage.getItem('account') ?? '';
        expect(storedJSON).not.toContain('secret');
        expect(JSON.stringify(saveNativeAccount.mock.calls[0][0])).not.toContain('secret');
        expect(await AsyncStorage.getItem('kelecNextGen')).toBe('true');
    });

    test('ne modifie pas le compte en mémoire', async () => {
        const user = new UserAccount('VIN1', [renault('VIN1', 'secret-r')]);
        await AccountRepository.save(user);
        expect(user.getCars()[0].getPassword()).toBe('secret-r');
    });
});

describe('AccountRepository.load', () => {
    test('null sans compte, ou sans le marqueur de la nouvelle interface', async () => {
        expect(await AccountRepository.load()).toBeNull();

        await AsyncStorage.setItem('account', JSON.stringify(new UserAccount('', [])));
        expect(await AccountRepository.load()).toBeNull();
    });

    test('reconstruit le bon type de compte avec le mot de passe chiffré', async () => {
        await AccountRepository.save(new UserAccount('VIN2', [renault('VIN1', 'secret-r'), hyundai('VIN2', 'secret-h')]));
        saveNativeAccount.mockClear();

        const user = await AccountRepository.load();

        expect(user?.getSelectedCar()).toBe('VIN2');
        expect(user?.getCars()[0]).toBeInstanceOf(RenaultAccount);
        expect(user?.getCars()[1]).toBeInstanceOf(HyundaiAccount);
        expect(user?.getCars().map(account => account.getPassword())).toEqual(['secret-r', 'secret-h']);
        expect(saveNativeAccount).not.toHaveBeenCalled(); // rien à migrer
    });

    test('migre un ancien mot de passe en clair vers le stockage chiffré', async () => {
        const legacy = new UserAccount('VIN1', [new Account('r@x.fr', 'old-clear', CarMaker.RENAULT, new CarModel('VIN1', 'Zoé', '', CarMaker.RENAULT))]);
        await AsyncStorage.setItem('account', JSON.stringify(legacy));
        await AsyncStorage.setItem('kelecNextGen', 'true');

        const user = await AccountRepository.load();

        expect(user?.getCars()[0].getPassword()).toBe('old-clear');
        expect(await AsyncStorage.getItem('VIN1_password')).toBe('old-clear');
        expect(await AsyncStorage.getItem('account')).not.toContain('old-clear');
    });
});

describe('CarTypeRepository', () => {
    const carTypeData: CarTypeInterface = {
        brand: { name: 'renault', display_name: 'Renault' },
        model: { name: 'zoe', display_name: 'Zoé', engine_type: 'ELECTRIC' },
        battery: { size: 52, max_ac_power: 22, max_dc_power: 50 },
        chargingLimit: 100,
    } as CarTypeInterface;

    test('enregistre et relit sous <vin>/carType', async () => {
        expect(await CarTypeRepository.get('VIN1')).toBeNull();
        await CarTypeRepository.save('VIN1', new CarType(carTypeData));

        expect(await AsyncStorage.getItem('VIN1/carType')).not.toBeNull();
        expect((await CarTypeRepository.get('VIN1'))?.getBrand().name).toBe('renault');
    });

    test('ignore une entrée sans batterie', async () => {
        await AsyncStorage.setItem('VIN1/carType', JSON.stringify({ brand: carTypeData.brand }));
        expect(await CarTypeRepository.get('VIN1')).toBeNull();
    });
});

describe('logOut', () => {
    const clearCrypted = sharedPlatformsData.clearNativeCryptedData as jest.Mock; // simulé dans jest.setup.js

    beforeEach(() => clearCrypted.mockClear());

    test('efface les identifiants de chaque voiture, le stockage local et le compte des widgets', async () => {
        await AsyncStorage.setItem('account', '{}');
        await logOut(new UserAccount('VIN1', [renault('VIN1', 'secret-r'), hyundai('VIN2', 'secret-h')]));

        const clearedKeys = clearCrypted.mock.calls.map(call => call[0]);
        expect(clearedKeys).toEqual(expect.arrayContaining([
            'VIN1_password', 'jwt_r@x.fr', 'cookieValue_r@x.fr',
            'VIN2_password', 'jwt_h@x.fr', 'cookieValue_h@x.fr',
        ]));
        expect(await AsyncStorage.getItem('account')).toBeNull();
        expect(saveNativeAccount).toHaveBeenCalledWith(null);
    });

    test('se déconnecte même si un identifiant ne peut pas être effacé', async () => {
        clearCrypted.mockRejectedValueOnce(new Error('introuvable'));
        await AsyncStorage.setItem('account', '{}');

        await logOut(new UserAccount('VIN1', [renault('VIN1', 'secret-r')]));

        expect(await AsyncStorage.getItem('account')).toBeNull();
        expect(saveNativeAccount).toHaveBeenCalledWith(null);
    });
});
