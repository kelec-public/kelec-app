import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import React from "react";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor, screen } from "@testing-library/react-native";
import { CarTypeInterface } from "../../src/lib/clients/cars/carTypes/carType";
import RenaultCar from "../../src/lib/clients/cars/renaultCar";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import { CarMakerClientErrors } from "../../src/lib/clients/carMakers/carMakerClient";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    mockGetBatteryStatus.mockReset();
    mockGetCockpitStatus.mockReset();
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});



const mockGetBatteryStatus = jest.fn();
const mockGetCockpitStatus = jest.fn();
jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: mockGetCockpitStatus,
            getLocation: jest.fn().mockImplementation(() => {
                return {
                    hasError: true
                }
            }),
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getHVACStatus: jest.fn().mockImplementation(() => {
                return {
                    hasError: true
                }
            })
        }
    });
});

const mockJSONBatteryStatus = require('./mocks/mockRenaultBattery.json');
const mockJSONCockpit = require('./mocks/mockRenaultCockpit.json');

test('should render the car view', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(202);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('30 995');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
        expect(screen.queryAllByTestId('summaryCardEstimatedICEEnergyText')).toHaveLength(0);
        expect(screen.queryAllByTestId('summaryCardICERange')).toHaveLength(0);
        expect(screen.queryAllByTestId('summaryCardAllEnginesRange')).toHaveLength(0);
    });
});

test('should render the car view from cache', async () => {
    await AsyncStorage.setItem('vin1/batteryStatus', JSON.stringify({ hasError: false, apiData: mockJSONBatteryStatus }));
    await AsyncStorage.setItem('vin1/cockpitStatus', JSON.stringify({ hasError: false, apiData: mockJSONCockpit }));

    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: true });
    mockGetCockpitStatus.mockResolvedValueOnce({ hasError: true });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(202);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('30 995');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
        expect(screen.getByTestId('lastUpdateText').props.children[1]).toBe(' le 30/03/2024 à 20:28');
    });
});

test('should open TFA view when token is expired', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: true, errorMessage: CarMakerClientErrors.PENDING_TFA });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('TfaView')).toBeDefined();
    });

});

test('should render the car view from cache AND update the ui', async () => {
    await AsyncStorage.setItem('vin1/batteryStatus', JSON.stringify({ hasError: false, apiData: mockJSONBatteryStatus }));
    await AsyncStorage.setItem('vin1/cockpitStatus', JSON.stringify({ hasError: false, apiData: mockJSONCockpit }));

    const mockBatteryStatus = JSON.parse(JSON.stringify(mockJSONBatteryStatus));
    mockBatteryStatus.batteryAutonomy = 250;

    const mockCockpitStatus = JSON.parse(JSON.stringify(mockJSONCockpit));
    mockCockpitStatus.totalMileage = 100;

    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: mockBatteryStatus });
    mockGetCockpitStatus.mockResolvedValueOnce({ hasError: false, apiData: mockCockpitStatus });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardRange').props.children[0]).toBe(250);
        expect(screen.getByTestId('summaryCardOdometer').props.children[0]).toBe('100');
        expect(screen.queryAllByTestId('summaryCardEstimatedEnergy')).toHaveLength(1);
        expect(screen.getByTestId('summaryCardEstimatedEnergyText').props.children[0]).toBe(0);
    });
});

test('should render an error', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: true });
    mockGetCockpitStatus.mockResolvedValueOnce({ hasError: true });

    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('errorView')).toBeDefined();
    });
});

describe('should handle charge limit', () => {
    test('should not display charge limit', async () => {
        mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONBatteryStatus });
        mockGetCockpitStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONCockpit });

        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId('summaryCard')).toBeDefined();
            expect(() => screen.getByTestId('chargingLimitBar')).toThrow();
        });
    });
});