import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import React from "react";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { fireEventAsync, render, waitFor } from "@testing-library/react-native";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import StorageHandler from "../../src/lib/storage/storageHandler";
import CarType, { CarTypeInterface } from "../../src/lib/clients/cars/carTypes/carType";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

const mockApiData = require('./mocks/mockHyundaiApiData.json');
const mockGetCarStatus = jest.fn();
jest.mock('../../src/lib/clients/carMakers/hyundaiClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getCarStatus: mockGetCarStatus
        }
    });
});


test('should render the batteryCard view', async () => {
    const { getByTestId } = render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    })
    await waitFor(() => {
        expect(getByTestId('batteryCard')).toBeDefined();
        // check the battery level
        expect(getByTestId('batteryPercentage').props.children).toBe(62); // 62% soc
    });
});

test('charging limit popup should not be displayed with hyundai cars', async () => {
    await AsyncStorage.setItem('vin1/carType', JSON.stringify({
        brand: { name: 'hyundai', display_name: 'HyundaiBrandToAdd' },
        model: { name: 'ZOE', display_name: 'ZOEModelToAdd', engine_type: 'ELEC' },
        battery: { size: 60, max_ac_power: 7.4, max_dc_power: 130 },
    }));

    const { getByTestId, queryByTestId } = render(<App />);

    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData,
    });

    await waitFor(() => {
        expect(getByTestId('batteryCard')).toBeDefined();
    });

    await fireEventAsync.press(getByTestId('BatteryCardButton'));

    await waitFor(() => {
        expect(queryByTestId('BatteryModalCloseButton')).toBeNull();
    });
});