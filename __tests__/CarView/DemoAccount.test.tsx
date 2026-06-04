jest.unmock('../../src/lib/clients/kelec-api/kelecApiHandler');
import React from "react";
import { fireEventAsync, render, waitFor } from "@testing-library/react-native";
import App from "../../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { Alert } from "react-native";

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.useFakeTimers();

beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await AsyncStorage.clear();
});

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

const mockSaveNativeAccount = jest.fn();
const mockSaveNativeImage = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockImplementation(mockSaveNativeImage);
let mockImageFetch = jest.fn()
jest.mock('../../src/lib/graphics/imageFetcher', () => {
    return jest.fn().mockImplementation(() => {
        return Promise.resolve(mockImageFetch());
    });
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



test('Should use the demo account', async () => {
    const { getByTestId, queryAllByTestId, getByText } = render(<App />);

    // choose any car maker
    await waitFor(() => {
        // wait for app to load
    });
    const renaultLogo = getByTestId('renaultLogo');
    await fireEventAsync.press(renaultLogo);
    const nextStepButton = getByTestId('nextStepButton');
    await fireEventAsync.press(nextStepButton);

    const emailInput = getByTestId('emailInput');
    const passwordInput = getByTestId('passwordInput');

    await fireEventAsync.changeText(emailInput, 'kelec-demo@gmail.com');
    await fireEventAsync.changeText(passwordInput, 'demo');

    const loginButton = getByTestId('loginButton');

    await fireEventAsync.press(loginButton);

    const carList = queryAllByTestId('carRowCard');
    expect(carList).toHaveLength(2);

    // select the first car

    await fireEventAsync.press(carList[0]);

    // add the selected car
    const addSelectedCarButton = getByTestId('addSelectedCarButton');
    await fireEventAsync.press(addSelectedCarButton);


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

    // add the car
    const confirmCarModelChoice = getByTestId('confirmCarModelChoice');
    expect(confirmCarModelChoice).toBeTruthy();
    await fireEventAsync.press(confirmCarModelChoice);
    await waitFor(async () => {
        const carsPageView = getByTestId('carsPageView');
        expect(carsPageView).toBeTruthy();
    });

    // check that the range is displayed
    const rangeText = getByTestId('summaryCardRange');
    expect(rangeText).toBeTruthy();
    expect(rangeText.props.children[0]).toBe(202);

    // try to launch HVAC
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
    // open modal
    await fireEventAsync.press(getByTestId('HVACCardButton'));

    // make sure the temp is set to default
    await waitFor(() => {
        const temperatureText = getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("21");
    });
    // press confirm button
    await fireEventAsync.press(getByTestId('confirmButton'));

    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenLastCalledWith("Informations envoyées", "Le préchauffage a été lancé");
    });
});