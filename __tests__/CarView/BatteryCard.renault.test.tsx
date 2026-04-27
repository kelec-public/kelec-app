import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import React from "react";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor, fireEventAsync } from "@testing-library/react-native";
import RenaultCar from "../../src/lib/clients/cars/renaultCar";
import UserAccount from "../../src/lib/clients/accounts/userAccount";

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
const mockGetCockpitStatus = jest.fn();
const mockGetLocationStatus = jest.fn();
const mockGetChargeSettings = jest.fn();
jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: mockGetCockpitStatus,
            getLocation: mockGetLocationStatus,
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargeSettings: mockGetChargeSettings
        }
    });
});

const mockJSONBatteryStatus = require('./mocks/mockRenaultBattery.json');
const mockJSONCockpit = require('./mocks/mockRenaultCockpit.json');
const mockJSONChargesSettings = require('./mocks/mockRenaultChargeSettings.json');

test('should render the car view', async () => {
    const { getByTestId, queryAllByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetLocationStatus.mockResolvedValueOnce({
        hasError: true,
    });
    mockGetChargeSettings.mockResolvedValueOnce({
        hasError: true
    });

    await waitFor(() => {
        expect(getByTestId('batteryCard')).toBeDefined();
        // check the battery level
        expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

        const nextCharge = queryAllByTestId('shouldDisplayNextCharge');
        expect(nextCharge).toHaveLength(0);
    });
});

describe('should display next charge', () => {

    test('should display next charge for delayed charge', async () => {
        const { getByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONBatteryStatus
        });
        mockGetCockpitStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONCockpit
        });
        mockGetLocationStatus.mockResolvedValueOnce({
            hasError: true,
        });
        mockGetChargeSettings.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONChargesSettings
        });
        await waitFor(() => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(23);
            oracleTime.setMinutes(45);
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "mardi à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });
    });

    test('should display next charge for scheduled charge with one schedule', async () => {
        const mockScheduledCharge = require('./mocks/mockRenaultChargeSettings/mockRenaultChargeSettingsSchedulded.json');
        const { getByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONBatteryStatus
        });
        mockGetCockpitStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONCockpit
        });
        mockGetLocationStatus.mockResolvedValueOnce({
            hasError: true,
        });
        mockGetChargeSettings.mockResolvedValueOnce({
            hasError: false,
            apiData: mockScheduledCharge
        });
        await waitFor(() => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(2);
            oracleTime.setMinutes(39);
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "lundi à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });
    });


    test('should display next charge for scheduled charge with two schedules', async () => {
        const mockScheduledCharge = require('./mocks/mockRenaultChargeSettings/mockRenaultChargeSettingsSchedulded.json');
        mockScheduledCharge.schedules[1].activated = true
        const { getByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONBatteryStatus
        });
        mockGetCockpitStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONCockpit
        });
        mockGetLocationStatus.mockResolvedValueOnce({
            hasError: true,
        });
        mockGetChargeSettings.mockResolvedValueOnce({
            hasError: false,
            apiData: mockScheduledCharge
        });
        await waitFor(() => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(22);
            oracleTime.setMinutes(53);
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "samedi à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });
    });

    test('should display next charge for scheduled charge with two schedules with a schedule for the same day', async () => {
        const mockScheduledCharge = require('./mocks/mockRenaultChargeSettings/mockRenaultChargeSettingsSchedulded.json');
        mockScheduledCharge.dateTime = "2024-11-09T21:46:50.7384423Z"; // saturday
        mockScheduledCharge.schedules[1].saturday.startTime = "T14:22Z"; // start day is before the current time, should skip to the next schedule
        mockScheduledCharge.schedules[1].activated = true
        const { getByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONBatteryStatus
        });
        mockGetCockpitStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONCockpit
        });
        mockGetLocationStatus.mockResolvedValueOnce({
            hasError: true,
        });
        mockGetChargeSettings.mockResolvedValueOnce({
            hasError: false,
            apiData: mockScheduledCharge
        });
        await waitFor(() => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(22);
            oracleTime.setMinutes(53);
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "dimanche à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });
    });
});

describe('negative charging power popup', () => {
    const meganeCarType = {
        brand: { name: 'RENAULT', display_name: 'Renault' },
        model: { name: 'megane_e_tech', display_name: 'Megane E-Tech', engine_type: '' },
        battery: { size: 60, max_ac_power: 7, max_dc_power: -1 },
        chargingLimit: 80
    };
    // batteryLevel (90) > chargingLimit (80) → getChargingPower returns negative
    const batteryPluggedOverLimit = { ...mockJSONBatteryStatus, batteryLevel: 90, plugStatus: 1, chargingStatus: 1.0 };
    // batteryLevel (70) < chargingLimit (80) → getChargingPower returns positive
    const batteryPluggedUnderLimit = { ...mockJSONBatteryStatus, batteryLevel: 70, plugStatus: 1, chargingStatus: 1.0 };

    test('should display popup when charging power is negative', async () => {
        await AsyncStorage.setItem('vin1/carType', JSON.stringify(meganeCarType));
        const { getByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: batteryPluggedOverLimit });
        mockGetCockpitStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONCockpit });
        mockGetLocationStatus.mockResolvedValueOnce({ hasError: true });
        mockGetChargeSettings.mockResolvedValueOnce({ hasError: true });

        await waitFor(() => {
            expect(getByTestId('negativeChargingPowerPopup')).toBeDefined();
        });
    });

    test('should not display popup when charging power is positive', async () => {
        await AsyncStorage.setItem('vin1/carType', JSON.stringify(meganeCarType));
        const { queryAllByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: batteryPluggedUnderLimit });
        mockGetCockpitStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONCockpit });
        mockGetLocationStatus.mockResolvedValueOnce({ hasError: true });
        mockGetChargeSettings.mockResolvedValueOnce({ hasError: true });

        await waitFor(() => {
            expect(queryAllByTestId('negativeChargingPowerPopup')).toHaveLength(0);
        });
    });
});

describe('should display next charge with scheduled offset from app preferences', () => {

    test('should display next charge for scheduled charge with one schedule', async () => {
        const mockScheduledCharge = require('./mocks/mockRenaultChargeSettings/mockRenaultChargeSettingsSchedulded.json');
        const { getByTestId, queryAllByTestId } = render(<App />);
        mockGetBatteryStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONBatteryStatus
        });
        mockGetCockpitStatus.mockResolvedValueOnce({
            hasError: false,
            apiData: mockJSONCockpit
        });
        mockGetLocationStatus.mockResolvedValueOnce({
            hasError: true,
        });
        mockGetChargeSettings.mockResolvedValueOnce({
            hasError: false,
            apiData: mockScheduledCharge
        });
        await waitFor(() => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(22);
            oracleTime.setMinutes(53);
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "dimanche à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });

        // open the settings row
        const bottomButtonperson = queryAllByTestId('bottomButtonsettings');
        await fireEventAsync.press(bottomButtonperson[0]);
        await waitFor(() => {
            expect(getByTestId('settingsView')).toBeDefined();
        });

        // open the modal for timezime
        // make sure the access time button is displayed
        const accessTime = getByTestId('testSettingRowaccess-time');
        await fireEventAsync.press(accessTime);

        // set the timezone to +2
        const timezone = getByTestId('timezoneOffsetButton' + 2);
        await fireEventAsync.press(timezone);

        // go back to car view
        const bottomButtoncars = queryAllByTestId('bottomButtondirections-car');
        await fireEventAsync.press(bottomButtoncars[0]);
        await waitFor(async () => {
            expect(getByTestId('batteryCard')).toBeDefined();
            // check the battery level
            expect(getByTestId('batteryPercentage').props.children).toBe(56); // 56% soc

            const nextChargeDate = getByTestId('nextChargeDate');
            const oracleTime = new Date();
            oracleTime.setHours(0);
            oracleTime.setMinutes(53); // two more hours
            const strTime = oracleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const expectedNextCharge = "lundi à " + strTime;
            expect(nextChargeDate.props.children).toBe(expectedNextCharge);
        });
    });
});