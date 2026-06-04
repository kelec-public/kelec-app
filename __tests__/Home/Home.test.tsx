import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import App from "../../App";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import UserAccount from "../../src/lib/clients/accounts/userAccount";


jest.useFakeTimers();
jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeAll(async () => {
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

test('CarsView screen should display the current user', async () => {
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('carsView')).toBeDefined();
    });

});

const mockGetMessage = jest.fn().mockResolvedValue("This is a test message");

jest.mock("../../src/lib/clients/kelec-api/kelecApiHandler", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getMessage: mockGetMessage
    }))
}));

jest.mock("../../src/lib/model/localization/languageHandler", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getLanguage: jest.fn().mockReturnValue('fr'),
        getTranslation: jest.fn().mockImplementation((key: string) => {
            return key;
        })
    }))
}));


describe('Home messages modal', () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
        jest.clearAllMocks();
    });

    it('should display message when there is one', async () => {

        const { getByTestId } = render(<App />);

        await waitFor(() => {
            const messageView = getByTestId("messageView");
            expect(messageView).toBeDefined();
            expect(mockGetMessage).toHaveBeenCalledTimes(1);
        });
    });

    it('should not display message when there is none', async () => {
        mockGetMessage.mockResolvedValueOnce(null);
        const { queryByTestId } = render(<App />);

        await waitFor(() => {
            const messageView = queryByTestId("messageView");
            expect(messageView).toBeNull();
            expect(mockGetMessage).toHaveBeenCalledTimes(1);
        });
    });
});

