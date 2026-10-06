import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import React from "react";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor } from "@testing-library/react-native";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount([account]);
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
