import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import RenaultCar from "../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import RenaultCharge from "../../src/lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import ChargesStorageController from "../../src/lib/storage/chargesHandler";
import { V2GApiSession } from "../../src/lib/clients/carMakers/renault/v2gApiResponse";
import CarType, { CarTypeInterface } from "../../src/lib/clients/cars/carTypes/carType";
import StorageHandler from "../../src/lib/storage/storageHandler";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

const mockGetBatteryStatus = jest.fn();
const mockGetChargesHistory = jest.fn();
let mockGetV2GChargesHistory = jest.fn();

jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getLocation: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargesHistory: mockGetChargesHistory,
            getV2GChargesHistory: mockGetV2GChargesHistory,
            getChargeSettings: jest.fn().mockResolvedValue({ hasError: true }),
            getHVACStatus: jest.fn().mockResolvedValue({ hasError: true }),
        }
    });
});

const mockJSONBatteryStatus = require('./mocks/mockRenaultBattery.json');
const mockJSONChargesHistory = require('./mocks/mockRenaultCharges.json');
const mockJSONV2GChargesHistory = require('./mocks/mockV2GSessions.json');

test('should render the charges card', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });
    mockGetV2GChargesHistory.mockResolvedValueOnce([]);
    const { getByTestId } = render(<App />);

    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
        const ChargesCardEnergyRecovered = getByTestId('ChargesCardEnergyRecovered');
        expect(ChargesCardEnergyRecovered.children[0]).toBe('105.45'); // 23.20 + 50.0 + 32.25
        const ChargesCardTotalTime = getByTestId('ChargesCardTotalTime');
        expect(ChargesCardTotalTime.children[0]).toBe("16"); // 16 hours : (388 + 55 + 543)/60 = 16
        expect(ChargesCardTotalTime.children[2]).toBe("26"); // 26 minutes : (388 + 55 + 543)%60 = 26
    });
});

test('should not render the charges card', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: true
    });
    mockGetV2GChargesHistory.mockResolvedValueOnce([]);
    const { queryByTestId } = render(<App />);

    await waitFor(() => {
        expect(queryByTestId('ChargesCard')).toBeNull();
    });
});


test('test add new charges with already cached charges', async () => {
    // first, save a charge
    const charge = new RenaultCharge("2024-01-01T10:00:00Z", "2024-01-01T11:02:00Z", 62, 20, 80, 40, "ok");
    await ChargesStorageController.saveNewCharges('vin1', [charge]);

    // now load the view
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });
    mockGetV2GChargesHistory.mockResolvedValueOnce([]);
    const { getByTestId } = render(<App />);

    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
        const ChargesCardEnergyRecovered = getByTestId('ChargesCardEnergyRecovered');
        expect(ChargesCardEnergyRecovered.children[0]).toBe('145.45'); // 23.20 + 50.0 + 32.25 (+40 cached charge)
        const ChargesCardTotalTime = getByTestId('ChargesCardTotalTime');
        expect(ChargesCardTotalTime.children[0]).toBe("17"); // 16 hours : (388 + 55 + 543 + 60)/60 = 17
        expect(ChargesCardTotalTime.children[2]).toBe("28"); // 26 minutes : (388 + 55 + 543 + 60)%60 = 28

    });
});

test('should now call v2g if car is not set as compatbile', async () => {
    const tempMockV2G = jest.fn();

    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });
    mockGetV2GChargesHistory = tempMockV2G;

    const { } = render(<App />);

    await waitFor(() => {
        expect(mockGetV2GChargesHistory).toHaveBeenCalledTimes(0)

    });

});

test('test add new V2G charges', async () => {
    const carInterface: CarTypeInterface = {
        brand: {
            display_name: "renault",
            name: "renault"
        },
        model: {
            display_name: "megane",
            name: "megane",
            engine_type: "ELECTRIC"
        },
        battery: {
            size: 60,
            max_ac_power: 11,
            max_dc_power: 60
        },
        chargingLimit: 100,
        supportsV2G: true
    }
    const carType: CarType = new CarType(carInterface);
    await new StorageHandler().setCarType("vin1", carType)


    // first, save a charge
    const charge = new RenaultCharge("2024-01-01T10:00:00Z", "2024-01-01T11:02:00Z", 62, 20, 80, 40, "ok", false, [], 10210, false, 12.25, true);
    await ChargesStorageController.saveNewCharges('vin1', [charge]);


    const sessions: V2GApiSession[] = mockJSONV2GChargesHistory._embedded.sessions;
    const session_to_keep = sessions[2];
    mockGetV2GChargesHistory.mockResolvedValueOnce([session_to_keep]);

    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const { getByTestId } = render(<App />);
    // d'abord on ouvre les reglages pour activer le fait que la voiture support le v2g



    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
        const ChargesCardEnergyRecovered = getByTestId('ChargesCardEnergyRecovered');
        expect(ChargesCardEnergyRecovered.children[0]).toBe('161.49'); // 23.20 + 50.0 + 32.25 (+40 cached charge) + 16.036 from v2g 
        const ChargesCardTotalTime = getByTestId('ChargesCardTotalTime');
        expect(ChargesCardTotalTime.children[0]).toBe("29"); // 29 hours : (388 + 55 + 543 + 62 + 705)/60 = 29
        expect(ChargesCardTotalTime.children[2]).toBe("13"); // 13 minutes : (388 + 55 + 543 + 62 + 705)%60 = 13

    });


});