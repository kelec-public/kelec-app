jest.unmock('../../src/lib/clients/kelec-api/kelecApiHandler');
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEventAsync, render, waitFor } from "@testing-library/react-native";
import React from "react";
import App from "../../App";
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { Alert } from 'react-native';
import StorageHandler from "../../src/lib/storage/storageHandler";
import { CarMaker } from "../../src/lib/clients/accounts/account";

jest.useFakeTimers();

const mockSaveNativeAccount = jest.fn();
const mockSaveNativeImage = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockImplementation(mockSaveNativeImage);

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);


let mockImageFetch = jest.fn()
jest.mock('../../src/lib/graphics/imageFetcher', () => {
    return jest.fn().mockImplementation(() => {
        return Promise.resolve(mockImageFetch());
    });
});


beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    /*     const account: Account = new Account('email', 'password', CarMaker.RENAULT);
        const userAccount: UserAccount = new UserAccount('', [account]);
        await AsyncStorage.setItem('account', JSON.stringify(userAccount));
        await AsyncStorage.setItem('carMaker', CarMaker.RENAULT); */

});


const mockBrands = jest.fn().mockResolvedValue([
    {
        "display_name": "RenaultBrandToAdd",
        "name": "renault",
    }
]);
const mockModels = jest.fn().mockResolvedValue([
    {
        "display_name": "ZOEModelToAdd",
        "name": "ZOE",
        "engine_type": "ELEC",
    }
]);
const mockBatteries = jest.fn().mockResolvedValue(
    [
        {
            "size": 60,
            "max_ac_power": 7.4,
            "max_dc_power": 130
        },
        {
            "size": 60,
            "max_ac_power": 22,
            "max_dc_power": -1 // -1 means that the car does not support DC charging
        }
    ]
);
jest.mock('../../src/lib/clients/kelec-api/kelecApiHandler', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBrands: jest.fn().mockResolvedValue(mockBrands()),
            getModels: jest.fn().mockResolvedValue(mockModels()),
            getBatteries: jest.fn().mockResolvedValue(mockBatteries()),
            getMessage: jest.fn().mockResolvedValue(null)
        }
    });
});

const getKamareonAccountBrandName = (carmaker: CarMaker): string => {
    switch (carmaker) {
        case CarMaker.RENAULT:
            return "MYRENAULT";
        case CarMaker.DACIA:
            return "MYDACIA";
        case CarMaker.ALPINE:
            return "MYALPINE";
        default:
            return "UNKNOWN"
    }
}

describe('Should add renault group cars', () => {
    const renaultGroupCarMakers = [
        CarMaker.ALPINE,
        CarMaker.DACIA,
        CarMaker.RENAULT
    ]
    for (const renaultGroupCarMaker of renaultGroupCarMakers) {
        test('Should add A renault group car', async () => {
            // only three images should load
            mockImageFetch = jest.fn().mockReturnValueOnce('image1');
            mockImageFetch.mockReturnValueOnce('image2');
            mockImageFetch.mockReturnValueOnce('image3');

            // mock cars fetching
            const mockCars = require('./mocks/mockRenaultCars.json');

            const mockFetch = jest.fn();

            global.fetch = mockFetch
                // to log in
                .mockResolvedValueOnce({
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
                        firstName: "firstName",
                        lastName: "lastName",
                        accounts: [
                            {
                                accountId: "accountId",
                                accountType: getKamareonAccountBrandName(renaultGroupCarMaker),
                                accountStatus: "ACTIVE",
                            }
                        ]
                    })
                })
                // to fetch the cars
                .mockResolvedValueOnce({
                    json: jest.fn().mockResolvedValueOnce({
                        statusCode: 200,
                        id_token: "id_token"
                    })
                }).mockResolvedValueOnce({
                    json: jest.fn().mockResolvedValueOnce(mockCars)
                })
                // the rest of the calls are to fetch the car status after it has been added
                .mockResolvedValue({
                    hasError: true,
                })


            const { getByTestId, queryAllByTestId, getByText } = render(<App />);
            await waitFor(() => {
                expect(getByTestId('loginView')).toBeTruthy();
            });

            // back button should not be visible
            expect(queryAllByTestId('addBackButton').length).toBe(0);

            // try to log in with brand
            const brandLogo = getByTestId(renaultGroupCarMaker + 'Logo');
            await fireEventAsync.press(brandLogo);
            // then go to next step
            const nextStepButton = getByTestId('nextStepButton');
            await fireEventAsync.press(nextStepButton);
            await waitFor(() => {
                expect(getByTestId('credentialsStepView')).toBeTruthy();
            });


            // fill the credentials
            const emailInput = getByTestId('emailInput');
            const passwordInput = getByTestId('passwordInput');
            expect(emailInput).toBeTruthy();
            await fireEventAsync.changeText(emailInput, 'email');
            await fireEventAsync.changeText(passwordInput, 'password');
            await waitFor(async () => {
                expect(emailInput.props.value).toBe('email');
                expect(passwordInput.props.value).toBe('password');
            });


            // try to log in 
            let loginButton = getByTestId('loginButton');
            await fireEventAsync.press(loginButton);
            await waitFor(async () => {
                expect(getByTestId('addViewSelector')).toBeTruthy();
                const carList = queryAllByTestId('carRowCard');
                expect(carList.length).toBe(3);

                // verify that the images have been successfully loaded
                const imagesRow = queryAllByTestId('addImageRow');
                expect(imagesRow.length).toBe(3);

                expect(imagesRow[0].props.source.uri).toBe("data:image/jpeg;base64,image1");
                expect(imagesRow[1].props.source.uri).toBe("data:image/jpeg;base64,image2");
                expect(imagesRow[2].props.source.uri).toBe("data:image/jpeg;base64,image3");
                const image1 = await AsyncStorage.getItem('VIN1/image');
                const image2 = await AsyncStorage.getItem('VIN2/image');
                const image3 = await AsyncStorage.getItem('VIN3/image');
                expect(image1).toBe('image1');
                expect(image2).toBe('image2');
                expect(image3).toBe('image3');
            });

            // try to add a car without having selected one
            let addSelectedCarButton = getByTestId('addSelectedCarButton');
            await fireEventAsync.press(addSelectedCarButton);
            await waitFor(async () => {
                expect(getByTestId('addViewSelector')).toBeTruthy();
                expect(Alert.alert).toHaveBeenCalledTimes(1);
                expect(Alert.alert).toHaveBeenLastCalledWith("Sélectionnez le véhicule que vous souhaitez ajouter");

            });


            // touch to select a car
            const carList = queryAllByTestId('carRowCard');
            await fireEventAsync.press(carList[0]);

            // add the selected car
            addSelectedCarButton = getByTestId('addSelectedCarButton');
            await fireEventAsync.press(addSelectedCarButton);
            await waitFor(async () => {
                expect(mockBrands).toHaveBeenCalled();
            });
            /* await waitFor(async () => {
                const carsPageView = getByTestId('carsPageView');
                expect(carsPageView).toBeTruthy();
            }); */

            //open the brand dropdown
            const brandDropdown = getByTestId('brandDropdown');
            expect(brandDropdown).toBeTruthy();
            await fireEventAsync.press(brandDropdown);

            // select the brand
            const renaultTestItem = getByText('RenaultBrandToAdd');
            await waitFor(async () => expect(renaultTestItem).toBeTruthy());
            await fireEventAsync.press(renaultTestItem);
            await waitFor(async () => expect(getByTestId('modelDropdown')).toBeTruthy());

            //open the model dropdown
            const modelDropdown = getByTestId('modelDropdown');
            expect(modelDropdown).toBeTruthy();
            await fireEventAsync.press(modelDropdown);

            // select the model
            const zoeTestItem = getByText('ZOEModelToAdd');
            await waitFor(async () => expect(zoeTestItem).toBeTruthy());
            await fireEventAsync.press(zoeTestItem);
            await waitFor(async () => expect(getByTestId('batteryDropdown')).toBeTruthy());

            // open the battery dropdown
            const batteryDropdown = getByTestId('batteryDropdown');
            expect(batteryDropdown).toBeTruthy();
            await fireEventAsync.press(batteryDropdown);

            // select the battery
            const batteryTestItem = getByText('60 kWh / AC 7.4 kW / DC 130 kW');
            await waitFor(async () => expect(batteryTestItem).toBeTruthy());
            await fireEventAsync.press(batteryTestItem);

            // check that the car supports v2g
            const V2GCompatibleSwitch = getByTestId('V2GCompatibleSwitch');
            await fireEventAsync(V2GCompatibleSwitch, 'onPress');
            await waitFor(() => {

            });

            // add the car
            const confirmCarModelChoice = getByTestId('confirmCarModelChoice');
            expect(confirmCarModelChoice).toBeTruthy();
            await fireEventAsync.press(confirmCarModelChoice);


            // check that the car has been added
            const account = await AsyncStorage.getItem('account');
            const accountObj = JSON.parse(account!);
            expect(accountObj).toMatchObject({
                "selectedCar": "VIN1",
                "cars": [
                    {
                        "email": "email",
                        "password": "",
                        "carMaker": renaultGroupCarMaker,
                        "car": {
                            "vin": "VIN1",
                            "model": "ZOE",
                            "imageUrl": "https://3dv.renault.com/ImageFromBookmark?configuration=STANDA%2FB10%2FEA2%2FDG%2FVT002%2FRET02%2FRALU16%2FDRAP03%2FHARM01%2FTEGNE%2FRDAR02%2FALEVA%2FSOP02C%2FTRNOR%2FLVAVIP%2FLVAREL%2FNAV3G3%2FRAD37A%2FSDPCLV%2FTLFRAN%2FSAN913%2FBT4MR1%2FNBT007%2FSKTPOU%2FPRLEX1&databaseId=b4572adc-6c81-48ef-b4b1-2aff24ed7550&bookmarkSet=RSITE&bookmark=EXT_34_DESSUS&profile=HELIOS_OWNERSERVICES_LARGE",
                            "registrationNumber": "DM700AA",
                            "carMaker": renaultGroupCarMaker,
                            "image": ""
                        },
                        "kamereonAccountID": "accountId",
                        "firstName": "firstName",
                        "lastName": "lastName"
                    }
                ]
            });

            // check car type
            const carType = await new StorageHandler().getCarType("VIN1");
            expect(carType?.getSupportsV2G()).toBe(true);



            expect(mockSaveNativeAccount).toHaveBeenCalledTimes(2);
            expect(mockSaveNativeImage).toHaveBeenCalledTimes(3);
        });
    }
})



test('Should have account locked', async () => {
    const mockFetch = jest.fn();

    // mock fetch
    global.fetch = mockFetch
        // to log in
        .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "Account temporarily locked out",
                data: {
                    personId: "personId"
                },
                sessionInfo: {
                    cookieName: "cookieName",
                    cookieValue: "cookieValue"
                }
            })
        });

    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with renault
    const renaultLogo = getByTestId('renaultLogo');
    await fireEventAsync.press(renaultLogo);
    // then go to next step
    const nextStepButton = getByTestId('nextStepButton');
    await fireEventAsync.press(nextStepButton);
    await waitFor(() => {
        expect(getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = getByTestId('emailInput');
    const passwordInput = getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await fireEventAsync.changeText(emailInput, 'email');
    await fireEventAsync.changeText(passwordInput, 'password');
    await waitFor(async () => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    // try to log in 
    const loginButton = getByTestId('loginButton');
    await fireEventAsync.press(loginButton);
    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Compte verrouillé. Réessayez dans quelques minutes.", [{ "text": "ok" }]);
    });
});

test('Should have entered incorrect crendetials', async () => {
    const mockFetch = jest.fn();

    // mock fetch
    global.fetch = mockFetch
        // to log in
        .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "invalid loginID or password"
            })
        });

    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with renault
    const renaultLogo = getByTestId('renaultLogo');
    await fireEventAsync.press(renaultLogo);
    // then go to next step
    const nextStepButton = getByTestId('nextStepButton');
    await fireEventAsync.press(nextStepButton);
    await waitFor(() => {
        expect(getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = getByTestId('emailInput');
    const passwordInput = getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await fireEventAsync.changeText(emailInput, 'email');
    await fireEventAsync.changeText(passwordInput, 'password');
    await waitFor(async () => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    // try to log in 
    const loginButton = getByTestId('loginButton');
    await fireEventAsync.press(loginButton);
    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Adresse mail ou mot de passe incorrect", [{ "text": "ok" }]);
    });
});

test('Should have a server error', async () => {
    const mockFetch = jest.fn();

    // mock fetch
    global.fetch = mockFetch
        // to log in
        .mockResolvedValueOnce({
            json: jest.fn().mockRejectedValueOnce({
                statusCode: 403,
                errorDetails: "invalid creds"
            })
        });

    const { getByTestId, queryByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with renault
    const renaultLogo = getByTestId('renaultLogo');
    await fireEventAsync.press(renaultLogo);
    // then go to next step
    const nextStepButton = getByTestId('nextStepButton');
    await fireEventAsync.press(nextStepButton);
    await waitFor(() => {
        expect(getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = getByTestId('emailInput');
    const passwordInput = getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await fireEventAsync.changeText(emailInput, 'email');
    await fireEventAsync.changeText(passwordInput, 'password');
    await waitFor(async () => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    // try to log in 
    const loginButton = getByTestId('loginButton');
    await fireEventAsync.press(loginButton);
    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Erreur serveur", [{ "text": "ok" }]);
        // la vue tfa ne doit pas être affichée
        expect(queryByTestId('TfaView')).toBeNull();
    });
});

test('Should open TFA view', async () => {
    const mockFetch = jest.fn();

    // mock fetch
    global.fetch = mockFetch
        // to log in
        .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                statusCode: 403,
                errorDetails: "Pending Two-Factor Authentication"
            })
        });

    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with renault
    const renaultLogo = getByTestId('renaultLogo');
    await fireEventAsync.press(renaultLogo);
    // then go to next step
    const nextStepButton = getByTestId('nextStepButton');
    await fireEventAsync.press(nextStepButton);
    await waitFor(() => {
        expect(getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = getByTestId('emailInput');
    const passwordInput = getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await fireEventAsync.changeText(emailInput, 'email');
    await fireEventAsync.changeText(passwordInput, 'password');
    await waitFor(async () => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    // try to log in 
    const loginButton = getByTestId('loginButton');
    await fireEventAsync.press(loginButton);
    await waitFor(async () => {
        expect(getByTestId('TfaView')).toBeTruthy();
    });
});