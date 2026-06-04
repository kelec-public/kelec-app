jest.unmock('../../src/lib/clients/kelec-api/kelecApiHandler');
import App from "../../App";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import UserAccount from "../../src/lib/clients/accounts/userAccount";

beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

const mockBrands = jest.fn();
const mockModels = jest.fn();
const mockBatteries = jest.fn();
jest.mock('../../src/lib/clients/kelec-api/kelecApiHandler', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBrands: mockBrands,
            getModels: mockModels,
            getBatteries: mockBatteries,
            getMessage: jest.fn().mockResolvedValue(null)
        }
    });
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

test('should have error fetching the brands', async () => {
    mockBrands.mockRejectedValueOnce(new Error('error fetching brands'));

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await screen.findByTestId('summaryCard');

    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await screen.findByTestId('carModelChoiceStep');


    await screen.findByTestId('brandError');
});

test('should have error fetching the models', async () => {
    mockBrands.mockResolvedValueOnce([{ display_name: 'HyundaiBrandToAdd', name: 'hyundai' }]);
    mockModels.mockRejectedValueOnce(new Error('error fetching models'));

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await screen.findByTestId('summaryCard');

    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });

    // select a brand
    const brandDropdown = screen.getByTestId('brandDropdown');
    await user.press(brandDropdown);

    const hyundaiTestItem = screen.getByText('HyundaiBrandToAdd');
    await user.press(hyundaiTestItem);
    await waitFor(() => {
        expect(screen.getByTestId('modelError')).toBeTruthy();
    });
});

test('should have error fetching the batteries', async () => {
    mockBrands.mockResolvedValueOnce([{ display_name: 'HyundaiBrandToAdd', name: 'hyundai' }]);
    mockModels.mockResolvedValueOnce([{ display_name: 'HyundaiModelToAdd', name: 'hyundai' }]);
    mockBatteries.mockRejectedValueOnce(new Error('error fetching batteries'));

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });
    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });

    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });

    // select a brand

    const brandDropdown = screen.getByTestId('brandDropdown');
    await user.press(brandDropdown);

    // select a model
    const hyundaiTestItem = screen.getByText('HyundaiBrandToAdd');
    await user.press(hyundaiTestItem);
    await waitFor(() => {
        expect(screen.getByTestId('modelDropdown')).toBeDefined();
    });

    // select a battery
    const modelDropdown = screen.getByTestId('modelDropdown');
    await user.press(modelDropdown);



    const hyundaiModelTestItem = screen.getByText('HyundaiModelToAdd');
    await user.press(hyundaiModelTestItem);
    await waitFor(() => {
        expect(screen.getByTestId('batteryError')).toBeTruthy();
    });
});
