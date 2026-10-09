import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultAccount from "../../../src/lib/clients/accounts/renaultAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import { ConnectedStatusRepository, retrofitConnectedStatus } from "../../../src/packages/kelec-garage";

const mockGetVehicles = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/renaultClient', () =>
    jest.fn().mockImplementation(() => ({ getVehicles: mockGetVehicles })));

const renault = (vin: string) =>
    new RenaultAccount(`${vin}@x.fr`, 'password', 'kamereon', new CarModel(vin, `model ${vin}`, '', CarMaker.RENAULT));

const status = (connected: boolean) => ({ connected, services: ['202'], applicableFeatures: [{ featureId: 4, status: 'ACTIVATED' }] });

const markerOf = (vin: string) => AsyncStorage.getItem(`${vin}/connectedStatusRetrofit`);

beforeEach(async () => {
    await AsyncStorage.clear();
    mockGetVehicles.mockReset();
});

test('enregistre le connectedStatus de la voiture, sans toucher aux autres', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(true) }, { vin: 'VIN2', connectedStatus: status(false) }] });

    expect(await retrofitConnectedStatus(renault('VIN1'))).toBe(true);

    expect(await ConnectedStatusRepository.get('VIN1')).toEqual(status(true));
    expect(await ConnectedStatusRepository.get('VIN2')).toBeNull();
    expect(await markerOf('VIN1')).toBe('true');
});

test("n'appelle l'API qu'une seule fois par voiture", async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [] });
    const account = renault('VIN1');

    await retrofitConnectedStatus(account);
    await retrofitConnectedStatus(account);

    expect(mockGetVehicles).toHaveBeenCalledTimes(1);
});

test('voiture supprimée du compte constructeur ou sans connectedStatus : rien enregistré, pas de nouvel appel', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN2' }] });

    expect(await retrofitConnectedStatus(renault('VIN1'))).toBe(false);
    expect(await retrofitConnectedStatus(renault('VIN2'))).toBe(false);

    expect(await ConnectedStatusRepository.get('VIN1')).toBeNull();
    expect(await ConnectedStatusRepository.get('VIN2')).toBeNull();
    expect(await markerOf('VIN1')).toBe('true');
    expect(await markerOf('VIN2')).toBe('true');
});

test("en cas d'échec de l'API, on ne fait rien (ni donnée, ni marqueur)", async () => {
    mockGetVehicles.mockResolvedValue({ hasError: true, vehicles: [] });
    expect(await retrofitConnectedStatus(renault('VIN1'))).toBe(false);

    mockGetVehicles.mockRejectedValue(new Error('network'));
    expect(await retrofitConnectedStatus(renault('VIN1'))).toBe(false);

    expect(await ConnectedStatusRepository.get('VIN1')).toBeNull();
    expect(await markerOf('VIN1')).toBeNull();
});

test("ne fait rien pour une voiture déjà enregistrée à l'ajout ou qui n'est pas Renault", async () => {
    await ConnectedStatusRepository.save('VIN1', status(true));

    expect(await retrofitConnectedStatus(renault('VIN1'))).toBe(false);
    expect(await retrofitConnectedStatus(
        new Account('h@x.fr', 'password', CarMaker.HYUNDAI, new CarModel('VIN4', 'Kona', '', CarMaker.HYUNDAI)),
    )).toBe(false);

    expect(mockGetVehicles).not.toHaveBeenCalled();
});
