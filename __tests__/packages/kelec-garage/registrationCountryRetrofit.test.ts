import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultAccount from "../../../src/lib/clients/accounts/renaultAccount";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import * as sharedPlatformsData from "../../../src/lib/storage/sharedPlatformsData";
import { AccountRepository, GarageService, retrofitRegistrationCountry } from "../../../src/packages/kelec-garage";

const mockGetVehicles = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/renaultClient', () =>
    jest.fn().mockImplementation(() => ({ getVehicles: mockGetVehicles })));

const renault = (vin: string, country?: string) =>
    new RenaultAccount(`${vin}@x.fr`, 'password', 'kamereon', new CarModel(vin, `model ${vin}`, '', CarMaker.RENAULT, 'AB123CD', country));

const vehicle = (vin: string, country?: string) => ({
    vin,
    vehicleDetails: { model: { label: 'ZOE' }, registrationNumber: 'AB123CD', ...(country ? { registrationCountry: { code: country } } : {}) },
});

const storedCountry = async (vin: string) => {
    const user = await AccountRepository.load();
    return user?.getCars().find(account => account.getCar()?.getVin() === vin)?.getCar()?.getRegistrationCountry();
};

const markerOf = (vin: string) => AsyncStorage.getItem(`${vin}/registrationCountryRetrofit`);

let user: UserAccount;

beforeEach(async () => {
    await AsyncStorage.clear();
    mockGetVehicles.mockReset();
    jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockResolvedValue();
    user = new UserAccount([renault('VIN1'), renault('VIN2')]);
    await AccountRepository.save(user);
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('enregistre le pays de la voiture, en mémoire et dans le compte', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [vehicle('VIN1', 'GB'), vehicle('VIN2', 'FR')] });
    const account = user.getCars()[0];

    expect(await retrofitRegistrationCountry(account)).toBe(true);

    expect(account.getCar()?.getRegistrationCountry()).toBe('GB');
    expect(await storedCountry('VIN1')).toBe('GB');
    // seule la voiture demandée est mise à jour
    expect(await storedCountry('VIN2')).toBeUndefined();
    expect(await markerOf('VIN1')).toBe('true');
});

test("n'appelle l'API qu'une seule fois par voiture", async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [] });
    const account = user.getCars()[0];

    await retrofitRegistrationCountry(account);
    await retrofitRegistrationCountry(account);

    expect(mockGetVehicles).toHaveBeenCalledTimes(1);
});

test('voiture supprimée du compte constructeur : rien enregistré, pas de nouvel appel', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [vehicle('VIN2', 'FR')] });
    const account = user.getCars()[0];

    expect(await retrofitRegistrationCountry(account)).toBe(false);

    expect(account.getCar()?.getRegistrationCountry()).toBeUndefined();
    expect(await storedCountry('VIN1')).toBeUndefined();
    expect(await markerOf('VIN1')).toBe('true');
});

test('voiture sans pays dans la réponse : rien enregistré', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [vehicle('VIN1')] });

    expect(await retrofitRegistrationCountry(user.getCars()[0])).toBe(false);
    expect(await storedCountry('VIN1')).toBeUndefined();
});

test("en cas d'échec de l'API, on ne fait rien (ni pays, ni marqueur)", async () => {
    mockGetVehicles.mockResolvedValue({ hasError: true, vehicles: [] });
    expect(await retrofitRegistrationCountry(user.getCars()[0])).toBe(false);

    mockGetVehicles.mockRejectedValue(new Error('network'));
    expect(await retrofitRegistrationCountry(user.getCars()[0])).toBe(false);

    expect(await storedCountry('VIN1')).toBeUndefined();
    expect(await markerOf('VIN1')).toBeNull();
});

test('voiture supprimée du garage pendant l\'appel : elle n\'est pas recréée', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [vehicle('VIN1', 'FR')] });
    const account = user.getCars()[0];
    // l'utilisateur supprime VIN1 (le compte enregistré n'a plus que VIN2)
    await new GarageService((await AccountRepository.load())!).deleteCar('VIN1');

    expect(await retrofitRegistrationCountry(account)).toBe(false);

    const stored = await AccountRepository.load();
    expect(stored?.getCars().map(car => car.getCar()?.getVin())).toEqual(['VIN2']);
});

test('plusieurs voitures en parallèle : aucun pays perdu', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [vehicle('VIN1', 'GB'), vehicle('VIN2', 'FR')] });

    await Promise.all(user.getCars().map(account => retrofitRegistrationCountry(account)));

    expect(await storedCountry('VIN1')).toBe('GB');
    expect(await storedCountry('VIN2')).toBe('FR');
});

test("ne fait rien pour une voiture qui a déjà un pays ou qui n'est pas Renault", async () => {
    expect(await retrofitRegistrationCountry(renault('VIN3', 'FR'))).toBe(false);
    expect(await retrofitRegistrationCountry(
        new Account('h@x.fr', 'password', CarMaker.HYUNDAI, new CarModel('VIN4', 'Kona', '', CarMaker.HYUNDAI, 'AB123CD')),
    )).toBe(false);

    expect(mockGetVehicles).not.toHaveBeenCalled();
});
