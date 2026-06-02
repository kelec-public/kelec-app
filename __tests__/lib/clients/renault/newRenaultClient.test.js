import AsyncStorage from '@react-native-async-storage/async-storage';
import NewRenaultClient from '../../../../src/lib/clients/carMakers/newRenaultClient';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { generateMockJwt, setTokens } from './renaultHelpers';
import OIDC from '../../../../src/packages/kelec-login/oidc/oidc';
import ApiError, { ApiErrorEnum } from '../../../../src/lib/clients/carMakers/error/apiError';
import { CarMaker } from '../../../../src/lib/clients/accounts/account';

import * as sharedPlatformsData from '../../../../src/lib/storage/sharedPlatformsData';

const mockGetValidToken = jest.fn();
jest.spyOn(sharedPlatformsData, 'getValidToken').mockImplementation(mockGetValidToken);

mockGetValidToken.mockImplementation(async (email) => {
    const tokensString = await AsyncStorage.getItem(`${email}_tokens`);
    if (!tokensString) {
        return null;
    }

    return tokensString;
});


beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
});

describe('constructor', () => {
    it('should be init without kamereon account id', async () => {
        const renaultClient = new NewRenaultClient('email');
        expect(renaultClient.getEmail()).toBe('email');
        expect(renaultClient.kamereonAccountID).toBe("");
    });

    it('should be init with kamereon account id', async () => {
        const renaultClient = new NewRenaultClient('email', 'kamereonAccountID');
        expect(renaultClient.getEmail()).toBe('email');
        expect(renaultClient.kamereonAccountID).toBe("kamereonAccountID");
    });
});


const client = new NewRenaultClient('email', '');
const mappedCarMakers = [
    {
        carMaker: CarMaker.ALPINE,
        expectedAccountId: "account_id_alpine"
    },
    {
        carMaker: CarMaker.DACIA,
        expectedAccountId: "account_id_dacia"
    },
    {
        carMaker: CarMaker.RENAULT,
        expectedAccountId: "account_id_renault"
    }
]

describe('getKamereonAccount', () => {

    beforeEach(async () => {
        jest.clearAllMocks();
        AsyncStorage.clear();
    });

    for (const { carMaker, expectedAccountId } of mappedCarMakers) {
        it('should return kamereon account id', async () => {
            setTokens("email");

            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({
                    currentUser: {
                        firstName: "First name",
                        lastName: "Last name",
                        accounts: [
                            {
                                accountId: "account_id_renault",
                                accountStatus: "ACTIVE",
                                accountType: "MYRENAULT"
                            },
                            {
                                accountId: "account_id_dacia",
                                accountStatus: "ACTIVE",
                                accountType: "MYDACIA"
                            },
                            {
                                accountId: "account_id_alpine",
                                accountStatus: "ACTIVE",
                                accountType: "MYALPINE"
                            }
                        ]
                    }
                })
            });

            const kamereonAccount = await client.getKamereonAccount(carMaker);
            expect(kamereonAccount.canLogin).toBe(true);
            expect(kamereonAccount.kamereonAccountID).toBe(expectedAccountId);
            expect(kamereonAccount.firstName).toBe("First name");
            expect(kamereonAccount.lastName).toBe("Last name");
        });
    }


    it('should return not ok', async () => {
        setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false
        });

        const kamereonAccount = await client.getKamereonAccount(CarMaker.RENAULT);
        expect(kamereonAccount.canLogin).toBe(false);
    });

    it('should return no account found', async () => {
        setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({
                currentUser: {
                    firstName: "First name",
                    lastName: "Last name",
                    accounts: []
                }
            })
        });

        const kamereonAccount = await client.getKamereonAccount(CarMaker.RENAULT);
        expect(kamereonAccount.canLogin).toBe(false);
    });
});


describe('getVehicles', () => {
    it('should return vehicles', async () => {
        setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({
                vehicleLinks: [
                    {
                        "name": "car1"
                    }
                ]
            })
        });

        const vehicles = await client.getVehicles();
        expect(vehicles.length).toBe(1);
    });

    it('should throw an error', async () => {
        setTokens("email");
        try {
            global.fetch = jest.fn().mockResolvedValueOnce({
                ok: false
            });
            await client.getVehicles();
        } catch (e) {
            const expectedError = new ApiError(ApiErrorEnum.FAILED_TO_GET_VEHICLES);
            expect(e).toBeInstanceOf(ApiError);
        }
    });
}); 