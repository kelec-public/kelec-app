import { CarMaker } from "../../../src/lib/clients/accounts/account";
import { CarMakerClientErrors } from "../../../src/lib/clients/carMakers/carMakerClient";
import { SELECTABLE_CAR_MAKERS } from "../../../src/packages/kelec-login/models/carMakers";
import { loginErrorMessageKey } from "../../../src/packages/kelec-login/services/loginErrors";
import { createLoginSource } from "../../../src/packages/kelec-login/services/createLoginSource";
import { DemoLoginSource, isDemoCredentials } from "../../../src/packages/kelec-login/services/sources/demoLoginSource";
import { HyundaiLoginSource } from "../../../src/packages/kelec-login/services/sources/hyundaiLoginSource";
import { PLACEHOLDER_CAR_IMAGE, RenaultLoginSource, pickRenaultImage } from "../../../src/packages/kelec-login/services/sources/renaultLoginSource";

const mockGetKamereonAccount = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/renaultClient', () =>
    jest.fn().mockImplementation(() => ({ getKamereonAccount: mockGetKamereonAccount })));

test('constructeurs proposés, dans l\'ordre, avec leur nom affiché', () => {
    expect(SELECTABLE_CAR_MAKERS).toEqual([
        { brand: CarMaker.ALPINE, display: 'Alpine' },
        { brand: CarMaker.DACIA, display: 'Dacia' },
        { brand: CarMaker.HYUNDAI, display: 'Hyundai' },
        { brand: CarMaker.RENAULT, display: 'Renault' },
    ]);
});

test('identifiants démo (sans tenir compte de la casse)', () => {
    expect(isDemoCredentials('Kelec-Demo@gmail.com', 'DEMO')).toBe(true);
    expect(isDemoCredentials('kelec-demo@gmail.com', 'autre')).toBe(false);
});

test('source selon le constructeur', () => {
    expect(createLoginSource(CarMaker.DEMO)).toBeInstanceOf(DemoLoginSource);
    expect(createLoginSource(CarMaker.HYUNDAI)).toBeInstanceOf(HyundaiLoginSource);
    [CarMaker.RENAULT, CarMaker.DACIA, CarMaker.ALPINE].forEach(carMaker =>
        expect(createLoginSource(carMaker)).toBeInstanceOf(RenaultLoginSource));
});

test('messages d\'erreur de connexion', () => {
    expect(loginErrorMessageKey(CarMakerClientErrors.SERVER_ERROR)).toBe('serverError');
    expect(loginErrorMessageKey(CarMakerClientErrors.ACCOUNT_LOCKED)).toBe('accountLocked');
    expect(loginErrorMessageKey(CarMakerClientErrors.INVALID_CREDENTIALS)).toBe('invalidPassWord');
    expect(loginErrorMessageKey('autre')).toBe('');
});

test('image Renault : vue mybrand_2, sinon image par défaut', () => {
    expect(pickRenaultImage(undefined)).toBe(PLACEHOLDER_CAR_IMAGE);
    expect(pickRenaultImage([
        { assetType: 'PICTURE', viewpoint: 'mybrand_1', renditions: [{ url: 'a' }] },
        { assetType: 'PICTURE', viewpoint: 'mybrand_2', renditions: [{ url: 'b' }] },
    ])).toBe('b');
});

describe('RenaultLoginSource.authenticate', () => {
    const source = new RenaultLoginSource(CarMaker.DACIA);

    test('succès : compte du bon constructeur, email normalisé', async () => {
        mockGetKamereonAccount.mockResolvedValueOnce({ canLogin: true, kamereonAccountID: 'kid', firstName: 'J', lastName: 'D' });
        const result = await source.authenticate('  User@X.fr ', 'pwd');
        expect(result.status).toBe('ok');
        if (result.status === 'ok') {
            expect(result.account.getEmail()).toBe('user@x.fr');
            expect(result.account.getCarMaker()).toBe(CarMaker.DACIA);
        }
    });

    test('TFA à faire', async () => {
        mockGetKamereonAccount.mockResolvedValueOnce({ canLogin: false, errorMessage: CarMakerClientErrors.PENDING_TFA, regToken: 'rt' });
        expect(await source.authenticate('a@b.c', 'p')).toEqual({ status: 'tfa', regToken: 'rt' });
    });

    test('erreur', async () => {
        mockGetKamereonAccount.mockResolvedValueOnce({ canLogin: false, errorMessage: CarMakerClientErrors.INVALID_CREDENTIALS });
        expect(await source.authenticate('a@b.c', 'p')).toEqual({ status: 'error', messageKey: 'invalidPassWord' });
    });
});

test('démo : deux voitures de démonstration', async () => {
    const cars = await new DemoLoginSource().listVehicles();
    expect(cars.map(car => car.getVin())).toEqual(['VF1AA', 'VF1AA2']);
});
