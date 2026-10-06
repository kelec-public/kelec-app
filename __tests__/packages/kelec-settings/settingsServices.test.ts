import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import { getUserDisplayName } from "../../../src/packages/kelec-settings/services/userDisplayName";
import { TIMEZONE_OFFSETS } from "../../../src/packages/kelec-settings/services/timezoneOffsets";
import { watchPasswords } from "../../../src/packages/kelec-settings/services/appleWatchSync";
import HyundaiAccount from "../../../src/lib/clients/accounts/hyundaiAccount";
import HyundaiCar from "../../../src/lib/clients/cars/hyundaiCar";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";

const account = (firstName?: string, lastName?: string) => {
    const acc = new Account('email', 'password', CarMaker.RENAULT);
    acc.firstName = firstName;
    acc.lastName = lastName;
    return acc;
};

test('getUserDisplayName : dernier compte avec prénom et nom, sinon null', () => {
    expect(getUserDisplayName(new UserAccount([account(), account('Jean')]))).toBeNull();
    expect(getUserDisplayName(new UserAccount([account('A', 'B'), account(), account('C', 'D')])))
        .toEqual({ firstName: 'C', lastName: 'D' });
});

test('décalages horaires de -5 à +5', () => {
    expect(TIMEZONE_OFFSETS).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
});

test('watchPasswords : uniquement les mots de passe Hyundai, par VIN', () => {
    const renault = new Account('email', 'renaultPassword', CarMaker.RENAULT,
        new RenaultCar('vinRenault', 'model', 'image', CarMaker.RENAULT, 'AA0001AA'));
    const hyundai = new HyundaiAccount('email', 'hyundaiPassword', '1234',
        new HyundaiCar('vinHyundai', 'model', 'image', CarMaker.HYUNDAI, 'AA0002AA'));
    const hyundaiWithoutCar = new HyundaiAccount('email', 'otherPassword', '1234');

    expect(watchPasswords(new UserAccount([renault, hyundai, hyundaiWithoutCar])))
        .toEqual({ vinHyundai: 'hyundaiPassword' });
});
