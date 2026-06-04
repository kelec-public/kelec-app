jest.unmock('../../src/lib/clients/kelec-api/kelecApiHandler');
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, waitFor, userEvent, screen } from "@testing-library/react-native";
import React from "react";
import App from "../../App";
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { Alert } from 'react-native';
jest.useFakeTimers();

const mockSaveNativeAccount = jest.fn();
const mockSaveNativeImage = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockImplementation(mockSaveNativeImage);

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);


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

const mockCars = jest.fn();
const mockCheckAuthorised = jest.fn(); // know if an user is authorised to use the app with hyundai
const mockCheckLogin = jest.fn(); // know if credentials entered are bluelink valid credentials
jest.mock('../../src/lib/clients/carMakers/hyundaiClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            checkAuthorised: mockCheckAuthorised,
            checkLogin: mockCheckLogin,
            getVehicles: mockCars,
            getCarStatus: jest.fn().mockResolvedValue({
                hasError: true
            })
        }
    });
});

let mockImageFetch = jest.fn()
jest.mock('../../src/lib/graphics/imageFetcher', () => {
    return jest.fn().mockImplementation(() => {
        return Promise.resolve(mockImageFetch());
    });
});


beforeEach(async () => {
    await AsyncStorage.clear();
    await jest.clearAllMocks();
    /*     const account: Account = new HyundaiAccount('email', 'password', '8056');
        await AsyncStorage.setItem('account', JSON.stringify(account));
        await AsyncStorage.setItem('carMaker', CarMaker.HYUNDAI); */
});


test('Should add A Hyundai car', async () => {
    const user = userEvent.setup();
    const mockCarsCatalog = require('./mocks/mockHyundaiCars.json');
    mockCars.mockResolvedValue({
        vehicles: mockCarsCatalog
    });
    mockCheckAuthorised.mockResolvedValue(true);
    mockCheckLogin.mockResolvedValue(true);
    // only three images should load
    mockImageFetch = jest.fn().mockReturnValueOnce('image1');
    mockImageFetch.mockReturnValueOnce('image2');
    mockImageFetch.mockReturnValueOnce('image3');

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with hyundai
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    // then go to next step
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);
    await waitFor(() => {
        expect(screen.getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await user.type(emailInput, 'email');
    await user.type(passwordInput, 'password');
    await waitFor(() => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    const loginButton = screen.getByTestId('loginButton');
    await user.press(loginButton);
    await waitFor(async () => {
        expect(screen.getByTestId('addViewSelector')).toBeTruthy();
        const carList = screen.queryAllByTestId('carRowCard');
        expect(carList.length).toBe(3);

        // verify that the images have been successfully loaded
        const imagesRow = screen.queryAllByTestId('addImageRow');
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
    let addSelectedCarButton = screen.getByTestId('addSelectedCarButton');
    await user.press(addSelectedCarButton);
    await waitFor(() => {
        expect(screen.getByTestId('addViewSelector')).toBeTruthy();
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Sélectionnez le véhicule que vous souhaitez ajouter");

    });

    // touch to select a car
    const carList = screen.queryAllByTestId('carRowCard');
    await user.press(carList[0]);

    // add the selected car
    addSelectedCarButton = screen.getByTestId('addSelectedCarButton');
    await user.press(addSelectedCarButton);

    // open the brand dropdown
    const brandDropdown = screen.getByTestId('brandDropdown');
    expect(brandDropdown).toBeTruthy();
    await user.press(brandDropdown);

    // select the brand

    const renaultTestItem = screen.getByText('RenaultBrandToAdd');
    await waitFor(() => expect(renaultTestItem).toBeTruthy());
    await user.press(renaultTestItem);
    await waitFor(() => expect(screen.getByTestId('modelDropdown')).toBeTruthy());

    //open the model dropdown
    const modelDropdown = screen.getByTestId('modelDropdown');
    expect(modelDropdown).toBeTruthy();
    await user.press(modelDropdown);

    // select the model
    const zoeTestItem = screen.getByText('ZOEModelToAdd');
    await waitFor(() => expect(zoeTestItem).toBeTruthy());
    await user.press(zoeTestItem);
    await waitFor(() => expect(screen.getByTestId('batteryDropdown')).toBeTruthy());

    // open the battery dropdown
    const batteryDropdown = screen.getByTestId('batteryDropdown');
    expect(batteryDropdown).toBeTruthy();
    await user.press(batteryDropdown);


    // select the battery
    const batteryTestItem = screen.getByText('60 kWh / AC 7.4 kW / DC 130 kW');
    await waitFor(() => expect(batteryTestItem).toBeTruthy());
    await user.press(batteryTestItem);

    // add the car
    const confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    expect(confirmCarModelChoice).toBeTruthy();
    await user.press(confirmCarModelChoice);
    await waitFor(() => {
        const carsPageView = screen.getByTestId('carsPageView');
        expect(carsPageView).toBeTruthy();
    });


    // check that the car has been added
    const account = await AsyncStorage.getItem('account');
    const accountObj = JSON.parse(account!);
    expect(accountObj).toMatchObject({
        "selectedCar": "VIN1",
        "cars": [
            {
                "email": "email",
                "password": "",
                "carMaker": "hyundai",
                "car": {
                    "vin": "VIN1",
                    "model": "IONIQ",
                    "imageUrl": "ioniqImage",
                    "registrationNumber": "AA001AA",
                    "carMaker": "hyundai",
                    "image": ""
                },
                "pinCode": "8056"
            }
        ]
    });

    expect(mockSaveNativeAccount).toHaveBeenCalledTimes(2);
    expect(mockSaveNativeImage).toHaveBeenCalledTimes(3);
});

test('Should not be authorised to use this app', async () => {
    const user = userEvent.setup();
    mockCheckAuthorised.mockResolvedValue(false);
    render(<App />);
    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with hyundai
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    // then go to next step
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);
    await waitFor(() => {
        expect(screen.getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await user.type(emailInput, 'email');
    await user.type(passwordInput, 'password');
    await waitFor(() => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    const loginButton = screen.getByTestId('loginButton');
    // try to log in
    await user.press(loginButton);
    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Not yet available", [{ "text": "ok" }]);
    });
});


test('Should have invalid credentials', async () => {
    const user = userEvent.setup();
    mockCheckAuthorised.mockResolvedValue(true);
    mockCheckLogin.mockResolvedValue(false);

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });

    // try to log in with hyundai
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    // then go to next step
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);
    await waitFor(() => {
        expect(screen.getByTestId('credentialsStepView')).toBeTruthy();
    });

    // fill the credentials
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    expect(emailInput).toBeTruthy();
    await user.type(emailInput, 'email');
    await user.type(passwordInput, 'password');
    await waitFor(() => {
        expect(emailInput.props.value).toBe('email');
        expect(passwordInput.props.value).toBe('password');
    });

    const loginButton = screen.getByTestId('loginButton');
    // try to log in
    await user.press(loginButton);
    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Adresse mail ou mot de passe incorrect", [{ "text": "ok" }]);
    });
}); 