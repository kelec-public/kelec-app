import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultAccount from "../../../src/lib/clients/accounts/renaultAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import { ConnectedStatusRepository, refreshConnectedStatus } from "../../../src/packages/kelec-garage";
import { CONNECTED_STATUS_REFRESH_DELAY_MS } from "../../../src/packages/kelec-garage/services/connectedStatusRefresh";

const mockGetVehicles = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/renaultClient', () =>
    jest.fn().mockImplementation(() => ({ getVehicles: mockGetVehicles })));

const renault = (vin: string) =>
    new RenaultAccount(`${vin}@x.fr`, 'password', 'kamereon', new CarModel(vin, `model ${vin}`, '', CarMaker.RENAULT));

const status = (connected: boolean) => ({ connected, services: ['202'], applicableFeatures: [{ featureId: 4, status: 'ACTIVATED' }] });

const T0 = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

beforeEach(async () => {
    await AsyncStorage.clear();
    mockGetVehicles.mockReset();
});

test('3 jours entre deux appels', () => {
    expect(CONNECTED_STATUS_REFRESH_DELAY_MS).toBe(3 * DAY);
});

test('voiture jamais vérifiée (ajoutée avant) : enregistre son connectedStatus, sans toucher aux autres', async () => {
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(true) }, { vin: 'VIN2', connectedStatus: status(false) }] });

    expect(await refreshConnectedStatus(renault('VIN1'), T0)).toBe(true);

    expect(await ConnectedStatusRepository.get('VIN1')).toEqual(status(true));
    expect(await ConnectedStatusRepository.lastCheckedAt('VIN1')).toBe(T0);
    expect(await ConnectedStatusRepository.get('VIN2')).toBeNull();
});

test("pas de nouvel appel avant 3 jours, puis mise à jour", async () => {
    const account = renault('VIN1');
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(false) }] });
    await refreshConnectedStatus(account, T0);

    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(true) }] });
    expect(await refreshConnectedStatus(account, T0 + 3 * DAY - 1)).toBe(false);
    expect(mockGetVehicles).toHaveBeenCalledTimes(1);

    expect(await refreshConnectedStatus(account, T0 + 3 * DAY)).toBe(true);
    expect(mockGetVehicles).toHaveBeenCalledTimes(2);
    expect(await ConnectedStatusRepository.get('VIN1')).toEqual(status(true));
});

test("voiture enregistrée à l'ajout : pas d'appel avant 3 jours", async () => {
    await ConnectedStatusRepository.save('VIN1', status(true), T0);

    expect(await refreshConnectedStatus(renault('VIN1'), T0 + DAY)).toBe(false);
    expect(mockGetVehicles).not.toHaveBeenCalled();
});

test('réponse sans connectedStatus (dégradée, thermique, voiture supprimée) : on garde l\'ancien et on retente dans 3 jours', async () => {
    const account = renault('VIN1');
    await ConnectedStatusRepository.save('VIN1', status(true), T0);
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1' }] });

    expect(await refreshConnectedStatus(account, T0 + 3 * DAY)).toBe(false);
    expect(await ConnectedStatusRepository.get('VIN1')).toEqual(status(true));
    expect(await ConnectedStatusRepository.lastCheckedAt('VIN1')).toBe(T0 + 3 * DAY);

    // la réponse suivante est complète : le connectedStatus est récupéré
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(false) }] });
    expect(await refreshConnectedStatus(account, T0 + 4 * DAY)).toBe(false);
    expect(await refreshConnectedStatus(account, T0 + 6 * DAY)).toBe(true);
    expect(await ConnectedStatusRepository.get('VIN1')).toEqual(status(false));
});

test("en cas d'échec de l'API, rien n'est noté : on retente au prochain chargement", async () => {
    mockGetVehicles.mockResolvedValue({ hasError: true, vehicles: [] });
    expect(await refreshConnectedStatus(renault('VIN1'), T0)).toBe(false);

    mockGetVehicles.mockRejectedValue(new Error('network'));
    expect(await refreshConnectedStatus(renault('VIN1'), T0)).toBe(false);

    expect(mockGetVehicles).toHaveBeenCalledTimes(2);
    expect(await ConnectedStatusRepository.get('VIN1')).toBeNull();
    expect(await ConnectedStatusRepository.lastCheckedAt('VIN1')).toBeNull();
});

test("une date de vérification dans le futur (horloge changée) ne bloque pas le rafraîchissement", async () => {
    await ConnectedStatusRepository.markChecked('VIN1', T0 + 10 * DAY);
    mockGetVehicles.mockResolvedValue({ hasError: false, vehicles: [{ vin: 'VIN1', connectedStatus: status(true) }] });

    expect(await refreshConnectedStatus(renault('VIN1'), T0)).toBe(true);
    expect(await ConnectedStatusRepository.lastCheckedAt('VIN1')).toBe(T0);
});

test("ne fait rien pour une voiture qui n'est pas Renault", async () => {
    expect(await refreshConnectedStatus(
        new Account('h@x.fr', 'password', CarMaker.HYUNDAI, new CarModel('VIN4', 'Kona', '', CarMaker.HYUNDAI)),
    )).toBe(false);

    expect(mockGetVehicles).not.toHaveBeenCalled();
});
