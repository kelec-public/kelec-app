import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import { getUserDisplayName } from "../../../src/packages/kelec-settings/services/userDisplayName";
import { TIMEZONE_OFFSETS } from "../../../src/packages/kelec-settings/services/timezoneOffsets";

const account = (firstName?: string, lastName?: string) => {
    const acc = new Account('email', 'password', CarMaker.RENAULT);
    acc.firstName = firstName;
    acc.lastName = lastName;
    return acc;
};

test('getUserDisplayName : dernier compte avec prénom et nom, sinon null', () => {
    expect(getUserDisplayName(new UserAccount('', [account(), account('Jean')]))).toBeNull();
    expect(getUserDisplayName(new UserAccount('', [account('A', 'B'), account(), account('C', 'D')])))
        .toEqual({ firstName: 'C', lastName: 'D' });
});

test('décalages horaires de -5 à +5', () => {
    expect(TIMEZONE_OFFSETS).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
});
