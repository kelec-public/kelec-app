import AsyncStorage from "@react-native-async-storage/async-storage";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { Linking } from "react-native";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import App from "../../App";
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

jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

test('should open the modal and click on the link', async () => {
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    render(<App />);
    const user = userEvent.setup();

    await waitFor(() => {
        expect(screen.getByTestId('openCoffeeModal')).toBeDefined();
    });

    await user.press(screen.getByTestId('openCoffeeModal'));
    await waitFor(() => {
        expect(screen.getByTestId('sendCoffeeView')).toBeDefined();
    });

    await user.press(screen.getByTestId('openDonation'));
    await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalledWith('https://www.paypal.com/donate/?hosted_button_id=8ZZMKEA6NTCDC');
    });
});

test('should open the modal and close it', async () => {
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    render(<App />);
    const user = userEvent.setup();

    await waitFor(() => {
        expect(screen.getByTestId('openCoffeeModal')).toBeDefined();
    });

    await user.press(screen.getByTestId('openCoffeeModal'));
    await waitFor(() => {
        expect(screen.getByTestId('sendCoffeeView')).toBeDefined();
    });

    await user.press(screen.getByTestId('closeSendCoffeeView'));
    await waitFor(() => {
        expect(screen.queryAllByTestId('sendCoffeeView').length).toBe(0);
    });
});