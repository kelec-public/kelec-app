import AsyncStorage from '@react-native-async-storage/async-storage';
import { CarMaker } from '../../../../src/lib/clients/accounts/account';
import RenaultClient from '../../../../src/lib/clients/carMakers/renaultClient';
import { HVACStatusEnum } from '../../../../src/lib/clients/carMakers/renaultEnums';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';



const renaultClient = new RenaultClient("email", "password");

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
});

describe('constructor', () => {
    it('should be init with kamereon account id', async () => {
        const renaultClient = new RenaultClient("email", "password", "accountId");
        const result = await renaultClient.getKamereonAccount();
        expect(result).toMatchObject({
            canLogin: true,
            kamereonAccountID: "accountId"
        });
    });
});

describe('get kamereon account', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });
    it('should get account', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                firstName: "First name",
                lastName: "Last name",
                accounts: [
                    {
                        accountId: "account_id1",
                        accountStatus: "ACTIVE",
                        accountType: "MYRENAULT"
                    }
                ]

            })
        });

        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(true);
        expect(account.kamereonAccountID).toBe('account_id1');
        expect(account.firstName).toBe('First name');
        expect(account.lastName).toBe('Last name');
    });

    it('should not get dacia account', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                firstName: "First name",
                lastName: "Last name",
                accounts: [
                    {
                        accountId: "account_id1",
                        accountStatus: "ACTIVE",
                        accountType: "MYRENAULT"
                    }
                ]

            })
        });

        const account = await renaultClient.getKamereonAccount(true);
        expect(account.canLogin).toBe(false);
    });

    it('should get dacia or alpine account', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                firstName: "First name",
                lastName: "Last name",
                accounts: [
                    {
                        accountId: "account_id1",
                        accountStatus: "ACTIVE",
                        accountType: "MYDACIA"
                    },
                    {
                        accountId: "account_id2",
                        accountStatus: "ACTIVE",
                        accountType: "MYALPINE"
                    }
                ]

            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                firstName: "First name",
                lastName: "Last name",
                accounts: [
                    {
                        accountId: "account_id1",
                        accountStatus: "ACTIVE",
                        accountType: "MYDACIA"
                    },
                    {
                        accountId: "account_id2",
                        accountStatus: "ACTIVE",
                        accountType: "MYALPINE"
                    }
                ]

            })
        });

        const account = await renaultClient.getKamereonAccount(CarMaker.DACIA);
        expect(account.canLogin).toBe(true);
        expect(account.kamereonAccountID).toBe('account_id1');
        expect(account.firstName).toBe('First name');
        expect(account.lastName).toBe('Last name');

        await AsyncStorage.clear();

        const account2 = await renaultClient.getKamereonAccount(CarMaker.ALPINE);
        expect(account2.canLogin).toBe(true);
        expect(account2.kamereonAccountID).toBe('account_id2');
        expect(account2.firstName).toBe('First name');
        expect(account2.lastName).toBe('Last name');
    });
});

describe('getGigyaToken', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });
    it('account should be locked', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "Account temporarily locked out"
            })
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("account_locked");
    });

    it('should be invalid credentials', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "invalid loginID or password"
            })
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("invalid_credentials");
    });


    it('should be invalid status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 500,
                errorDetails: "server_error"
            })
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });


    it('shouldn\'t be fetched', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce("error");
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });

    it('shouldn\'t be converted to json', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockRejectedValueOnce({
                statusCode: 500,
                errorDetails: "server_error"
            })
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    })

    it('should return account locked when requesting battery status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "Account temporarily locked out"
            })
        })
        const data = await renaultClient.getBatteryStatus("vin");
        expect(data.hasError).toBe(true);
        expect(data.errorMessage).toBe("account_locked");
    });
});

describe('getJWTToken', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.clear();
    });
    it('shouldn\'t be fetched', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce("error");
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });

    it('shouldn\'t be decoded to json', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockRejectedValue("error")
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });

    it('should be server side error', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 500,
                errorMessage: "server_error2"
            })
        });
        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });
});

describe('fetch kamareon account ID', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('shouldn\'t find account', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                firstName: "First name",
                lastName: "Last name",
                accounts: [
                    {
                        accountId: "account_id1",
                        accountStatus: "ACTIVE",
                        accountType: "MYDACIA"
                    }
                ]

            })
        });

        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });

    it('shouldn\'t fetch', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockRejectedValue("error");

        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });

    it('should decoe json', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockRejectedValue("error")
        });

        const account = await renaultClient.getKamereonAccount();
        expect(account.canLogin).toBe(false);
        expect(account.errorMessage).toBe("server_error");
    });
});

describe('getKamereonVehicles', () => {
    it('should get vehicles', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                vehicleLinks: [
                    {
                        "name": "car1"
                    }
                ]
            })
        });
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(false);
        expect(vehicles.vehicles.length).toBe(1);
    });

    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(true);
    });

    it('should have exeeded quota', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(true);
    });

    it('should not be able to decode json', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockRejectedValue("json_error")
        });
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have network', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce("error");
        const vehicles = await renaultClient.getVehicles();
        expect(vehicles.hasError).toBe(true);
    });
});

describe('getBatteryStatus', () => {
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch battery status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getBatteryStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have not authrorized access to the car', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch cockpit status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getCockpit("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch location status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getLocation("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockRejectedValueOnce("error");

        const account = await renaultClient.getCockpit("vin");
        expect(account.hasError).toBe(true);
    });
});

describe("no network for launching hvac", () => {
    it('should be an error', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockRejectedValueOnce("error");

        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });
});

describe('launchHVAC', () => {
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const hasLaunched = await renaultClient.launchHVAC("vin", 21);
        expect(hasLaunched).toBe(false);
    });

    it('should have launched HVAC', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should have fetched charges ', async () => {
        const chargesHistory = require('../../../CarView/mocks/mockRenaultCharges.json');
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const charges = await renaultClient.getChargesHistory("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should not have charges (should never happen ?)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should have fetched charge settings ', async () => {
        const chargeSettings = require('../../../CarView/mocks/mockRenaultChargeSettings.json');
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const charges = await renaultClient.getChargeSettings("vin");
        expect(charges.hasError).toBe(true);
    });

    it('should not gave charge settings (should never happen ?)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should have fetch hvac status', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                errorCode: "EXCEEDED_QUOTA"
            })
        });
        const vehicles = await renaultClient.getHVACStatus("vin");
        expect(vehicles.hasError).toBe(true);
    });

    it('should not have timestamp (should never happen ?)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
    it('shoul\'d not connect to gigya', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
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

    it('shoul\'d not connect to jwtToken', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 401,
                id_token: "id_token"
            })
        });
        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });

    it('should have fetched charges ', async () => {
        const chargesHistory = require('../../../CarView/mocks/mockV2GSessions.json');
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(
                chargesHistory
            )
        });
        const v2gCharges = await renaultClient.getV2GChargesHistory("vin");
        expect(v2gCharges.length).toEqual(3);
    });

    it('should have a v2g server error', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockRejectedValueOnce("server_error");
        try {
            await renaultClient.getV2GChargesHistory("vin");
            throw new Error('error should have been thrown');
        } catch (e) {
            expect(e.message).toBe("server_error");
        }
    });

    it('should have no charges', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        }).mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 200,
                id_token: "id_token"
            })
        }).mockResolvedValueOnce({
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