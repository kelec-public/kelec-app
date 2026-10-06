import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
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

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

test('should render the car view', async () => {
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(175);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('48 459');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
        expect(screen.getByTestId('lastUpdateText').props.children[1]).toBe(' le 27/03/2024 à 21:22');
    });
});
const mockJSONBatteryStatus = require('./mocks/mockHyundaiApiData.json');

test('should render the car view from cache', async () => {
    await AsyncStorage.setItem('vin1/batteryStatus', JSON.stringify({
        hasError: false,
        apiData: mockJSONBatteryStatus
    }));

    mockGetCarStatus.mockResolvedValueOnce({ hasError: true });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(175);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('48 459');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
        expect(screen.getByTestId('lastUpdateText').props.children[1]).toBe(' le 27/03/2024 à 21:22');
    });
});

test('should render the car view from cache AND update the ui', async () => {
    await AsyncStorage.setItem('vin1/batteryStatus', JSON.stringify({
        hasError: false,
        apiData: mockJSONBatteryStatus
    }));

    const mockBatteryStatus = JSON.parse(JSON.stringify(mockJSONBatteryStatus));
    mockBatteryStatus.vehicleStatus.evStatus.drvDistance[0].rangeByFuel.evModeRange.value = 200;
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockBatteryStatus
    });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(200);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('48 459');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
        expect(screen.getByTestId('lastUpdateText').props.children[1]).toBe(' le 27/03/2024 à 21:22');
    });
});

test('should render an error', async () => {
    mockGetCarStatus.mockResolvedValueOnce({ hasError: true });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('errorView')).toBeDefined();
    });
});