import AsyncStorage from '@react-native-async-storage/async-storage';
import { CarMaker } from '../../../../src/lib/clients/accounts/account';
import RenaultClient from '../../../../src/lib/clients/carMakers/renaultClient';
import { HVACStatusEnum } from '../../../../src/lib/clients/carMakers/renaultEnums';
import * as sharedPlatformsData from '../../../../src/lib/storage/sharedPlatformsData';
import OIDC from '../../../../src/packages/kelec-login/oidc/oidc';
import { generateMockJwt, setTokens } from './renaultHelpers';

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGetNativeCryptedData = jest.fn();
const mockSetNativeCryptedData = jest.fn();
const mockGetValidToken = jest.fn();
jest.spyOn(sharedPlatformsData, 'getValidToken').mockImplementation(mockGetValidToken);
jest.spyOn(sharedPlatformsData, 'getNativeCryptedData').mockImplementation(mockGetNativeCryptedData);
jest.spyOn(sharedPlatformsData, 'setNativeCryptedData').mockImplementation(mockSetNativeCryptedData);

mockGetNativeCryptedData.mockImplementation((key) =>
    AsyncStorage.getItem(key)
);

mockSetNativeCryptedData.mockImplementation((key, value) =>
    AsyncStorage.setItem(key, value)
);

mockGetValidToken.mockImplementation(async (email) => {
    const tokensString = await AsyncStorage.getItem(`${email}_tokens`);
    if (!tokensString) {
        return null;
    }

    return tokensString;
});


const renaultClient = new RenaultClient("email", "password");

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
});

describe('constructor', () => {
    it('should be init with kamereon account id', async () => {
        const renaultClient = new RenaultClient("email", "password", "accountId");
        expect(renaultClient.kamereonAccountID).toBe("accountId");
    });
});



describe('getBatteryStatus', () => {
    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch battery status', async () => {
        await setTokens("email");

        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        timestamp: "timestamp",
                        batteryLevel: 100
                    }
                }
            })
        });

        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(false);
        expect(vehicles.apiData.batteryLevel).toBe(100);
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");

        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have not authrorized access to the car', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                "type": "FUNCTIONAL",
                "messages": [
                    {
                        "code": "err.func.not.connected",
                        "message": "Access is denied for this resource"
                    }
                ],
                "errors": [
                    {
                        "errorCode": "err.func.not.connected",
                        "errorMessage": "Access is denied for this resource"
                    }
                ],
                "error_reference": "FUNCTIONAL"
            })
        });
        const data = await renaultClient.getBatteryStatus("vin");
        expect(data.hasError).toBe(true);
        expect(data.errorMessage).toBe("err.func.not.connected");
    });

    it('should not have timestamp (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });
});


describe('getCockpit', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch cockpit status', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        totalMileage: 100
                    }
                }
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(false);
        expect(vehicles.apiData.totalMileage).toBe(100);
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });
});


describe('getLocation', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch location status', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: {
                        lastUpdateTime: "2024-04-15T08:33:26.676Z",
                        gpsLatitude: 45.209857500000005,
                        gpsLongitude: 5.79008
                    }
                }
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(false);
        expect(vehicles.apiData.lastUpdateTime).toBe("2024-04-15T08:33:26.676Z");
        expect(vehicles.apiData.gpsLatitude).toBe(45.209857500000005);
        expect(vehicles.apiData.gpsLongitude).toBe(5.79008);
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });
});


describe("no network for kamereon endpoint", () => {
    it('should be an error', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockRejectedValueOnce("error");

        const account = await renaultClient.getCockpit("vin");
        expect(account.hasError).toBe(true);
    });
});

describe("no network for launching hvac", () => {
    it('should be an error', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockRejectedValueOnce("error");

        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });
});

describe('launchHVAC', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });

    it('should have launched HVAC', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    type: "HvacStart",
                    id: "-----",
                    attributes: {
                        action: "start",
                        targetTemperature: 21.0
                    }
                }
            })
        });
        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(true);
    });

    it('should have not launched HVAC', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                error: true
            })
        });
        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });
});



// get charges history

describe('getChargesHistory', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should have fetched charges ', async () => {
        const chargesHistory = require('../../../CarView/mocks/mockRenaultCharges.json');
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: {
                        charges: chargesHistory
                    }
                }
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(false);
        const fetchedCharges = charges.apiData;
        expect(fetchedCharges.length).toBe(chargesHistory.length);
        expect(fetchedCharges[0].chargeStartDate).toBe(chargesHistory[0].chargeStartDate);
        expect(fetchedCharges[0].chargeEndDate).toBe(chargesHistory[0].chargeEndDate);
    });

    it('should have removed invalid charges', async () => {
        const chargesHistory = require('../../../CarView/mocks/mockRenaultChargesInvalid.json');
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: {
                        charges: chargesHistory
                    }
                }
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(false);
        const fetchedCharges = charges.apiData;
        expect(fetchedCharges.length).toBe(2); // 2 valid charges
        expect(fetchedCharges[0].chargeStartDate).toBe(chargesHistory[4].chargeStartDate);
        expect(fetchedCharges[1].chargeEndDate).toBe(chargesHistory[4].chargeEndDate);
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should not have charges (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });
});


// get charges history
describe('getChargeSettings', () => {
    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should have fetched charge settings ', async () => {
        const chargeSettings = require('../../../CarView/mocks/mockRenaultChargeSettings.json');
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: chargeSettings
                }
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(false);
        const fetchedCharges = charges.apiData;
        /*  expect(fetchedCharges.length).toBe(chargesHistory.length);
         expect(fetchedCharges[0].chargeStartDate).toBe(chargesHistory[0].chargeStartDate);
         expect(fetchedCharges[0].chargeEndDate).toBe(chargesHistory[0].chargeEndDate); */
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should not gave charge settings (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });
});


describe('get hvac status', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch hvac status', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    id: "vin",
                    attributes: {
                        lastUpdateTime: "2024-04-15T08:33:26.676Z",
                        internalTemperature: 5.0,
                        hvacStatus: 'off',
                        socThreshold: 15.0
                    }
                }
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(false);
        expect(vehicles.apiData.lastUpdateTime).toBe("2024-04-15T08:33:26.676Z");
        expect(vehicles.apiData.internalTemperature).toBe(5.0);
        expect(vehicles.apiData.hvacStatus).toBe(HVACStatusEnum.OFF);
        expect(vehicles.apiData.socThreshold).toBe(15.0);
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                data: {
                    attributes: {
                        // empty
                    }
                }
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });
});


describe('get v2g sessions', () => {

    it('shoul\'d not connect to jwtToken', async () => {
        await AsyncStorage.setItem("email_tokens", JSON.stringify("bad data"));

        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });

    it('should have fetched charges ', async () => {
        const chargesHistory = require('../../../CarView/mocks/mockV2GSessions.json');
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(
                chargesHistory
            )
        });
        const v2gCharges = await renaultClient.getV2GChargesHistory("vin");
        expect(v2gCharges.length).toEqual(3);
    });

    it('should have a v2g server error', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockRejectedValueOnce("server_error");
        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });

    it('should have no charges', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                _embedded: {
                    sessions: []
                }
            })
        });
        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });

    it('should have exeeded quota', async () => {
        await setTokens("email");
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errors: [
                    {
                        errorCode: "EXCEEDED_QUOTA"
                    }
                ]
            })
        });
        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });
});