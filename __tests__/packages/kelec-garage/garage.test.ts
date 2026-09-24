import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker, MoveDirection } from "../../../src/lib/clients/accounts/account";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import { RenaultCredentials } from "../../../src/lib/clients/carMakers/renaultCredentials";
import * as sharedPlatformsData from "../../../src/lib/storage/sharedPlatformsData";
import { AccountRepository, CarImageRepository, GarageService } from "../../../src/packages/kelec-garage";

const car = (vin: string, email: string) =>
    new Account(email, 'password', CarMaker.RENAULT, new CarModel(vin, `model ${vin}`, '', CarMaker.RENAULT));

const vins = (user: UserAccount) => user.getCars().map(account => account.getCar()?.getVin());

let user: UserAccount;
let saveAccount: jest.SpyInstance;
let garage: GarageService;

beforeEach(async () => {
    await AsyncStorage.clear();
    user = new UserAccount('VIN1', [car('VIN1', 'a@x.fr'), car('VIN2', 'b@x.fr'), car('VIN3', 'c@x.fr')]);
    saveAccount = jest.spyOn(AccountRepository, 'save').mockResolvedValue();
    garage = new GarageService(user);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('GarageService', () => {
    test('selectDefaultCar change la voiture par défaut et enregistre', async () => {
        await garage.selectDefaultCar('VIN2');
        expect(user.getSelectedCar()).toBe('VIN2');
        expect(saveAccount).toHaveBeenCalledWith(user);
    });

    test('moveCar réordonne les voitures', async () => {
        await garage.moveCar('VIN2', MoveDirection.UP);
        expect(vins(user)).toEqual(['VIN2', 'VIN1', 'VIN3']);

        await garage.moveCar('VIN2', MoveDirection.DOWN);
        expect(vins(user)).toEqual(['VIN1', 'VIN2', 'VIN3']);
    });

    test('renameCar renomme la voiture', async () => {
        await garage.renameCar('VIN3', 'Ma Zoé');
        expect(user.getCars()[2].getCar()?.getModel()).toBe('Ma Zoé');
    });

    test('deleteCar efface les identifiants du compte, retire la voiture et garde ses données', async () => {
        const clearCredentials = jest.spyOn(RenaultCredentials, 'clearCredentials').mockResolvedValue();
        await AsyncStorage.setItem('VIN1/image', 'image');

        await garage.deleteCar('VIN1');

        expect(clearCredentials).toHaveBeenCalledWith('a@x.fr');
        expect(vins(user)).toEqual(['VIN2', 'VIN3']);
        expect(user.getSelectedCar()).toBe('VIN2');
        expect(saveAccount).toHaveBeenCalledWith(user);
        expect(await AsyncStorage.getItem('VIN1/image')).toBe('image'); // conservée pour une réimportation
    });

    test('deleteCar ne fait rien pour un VIN inconnu', async () => {
        const clearCredentials = jest.spyOn(RenaultCredentials, 'clearCredentials').mockResolvedValue();
        await garage.deleteCar('UNKNOWN');

        expect(clearCredentials).not.toHaveBeenCalled();
        expect(vins(user)).toEqual(['VIN1', 'VIN2', 'VIN3']);
    });
});

describe('CarImageRepository', () => {
    test('enregistre sous <vin>/image et transmet aux widgets', async () => {
        const saveNativeImage = jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockResolvedValue();

        expect(await CarImageRepository.get('VIN1')).toBeNull();
        await CarImageRepository.save('VIN1', 'base64');

        expect(saveNativeImage).toHaveBeenCalledWith('base64', 'VIN1');
        expect(await AsyncStorage.getItem('VIN1/image')).toBe('base64');
        expect(await CarImageRepository.get('VIN1')).toBe('base64');
    });
});
