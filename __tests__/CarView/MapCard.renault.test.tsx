import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import React from "react";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { fireEventAsync, render, waitFor, screen } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
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
jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: mockGetCockpitStatus,
            getLocation: mockGetLocationStatus,
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargeSettings: jest.fn().mockResolvedValue({ hasError: true }),
            getHVACStatus: jest.fn().mockResolvedValue({ hasError: true }),
        }
    });
});

const mockJSONBatteryStatus = require('./mocks/mockRenaultBattery.json');
const mockJSONCockpit = require('./mocks/mockRenaultCockpit.json');
const mockJSONLocation = require('./mocks/mockRenaultLocation.json');



test('should render the map card', async () => {
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
        // check the small region is correct
        const smallRegion = getByTestId('mapCardSmallRegion').props.region;
        expect(smallRegion.latitude).toBe(10.1);
        expect(smallRegion.longitude).toBe(5.5);
        expect(smallRegion.latitudeDelta).toBe(0.0222);
        expect(smallRegion.longitudeDelta).toBe(0.0222);

        const resetSmallRegionButton = queryAllByTestId('resetSmallRegionButton');
        expect(resetSmallRegionButton).toHaveLength(0);
    });
});

test('should render the map card from cache', async () => {
    await AsyncStorage.setItem('vin1/batteryStatus', JSON.stringify({
        hasError: false,
        apiData: mockJSONBatteryStatus
    }));
    await AsyncStorage.setItem('vin1/locationStatus', JSON.stringify({
        hasError: false,
        apiData: mockJSONLocation
    }));
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
        hasError: true
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
        // check the small region is correct
        const smallRegion = getByTestId('mapCardSmallRegion').props.region;
        expect(smallRegion.latitude).toBe(10.1);
        expect(smallRegion.longitude).toBe(5.5);
        expect(smallRegion.latitudeDelta).toBe(0.0222);
        expect(smallRegion.longitudeDelta).toBe(0.0222);

        const resetSmallRegionButton = queryAllByTestId('resetSmallRegionButton');
        expect(resetSmallRegionButton).toHaveLength(0);
    });
});

test('should not render the map card bc of an error', async () => {
    const { queryAllByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetLocationStatus.mockResolvedValueOnce({
        hasError: true
    });

    await waitFor(() => {
        expect(queryAllByTestId('mapCard')).toHaveLength(0);
    });
});

test('should drag the small map', async () => {
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
        // check the small region is correct
        const smallRegion = getByTestId('mapCardSmallRegion').props.region;
        expect(smallRegion.latitude).toBe(10.1);
        expect(smallRegion.longitude).toBe(5.5);
        expect(smallRegion.latitudeDelta).toBe(0.0222);
        expect(smallRegion.longitudeDelta).toBe(0.0222);

        const resetSmallRegionButton = queryAllByTestId('resetSmallRegionButton');
        expect(resetSmallRegionButton).toHaveLength(0);
    });


    // simulate drag on the map
    await fireEventAsync(getByTestId('mapCardSmallRegion'), 'onPanDrag', {
        coordinate: {
            latitude: 10.2,
            longitude: 5.6
        },
        position: {
            x: 100,
            y: 100
        }
    });
    await waitFor(() => {
        //expect the reset button to appear
        const resetSmallRegionButton = getByTestId('resetSmallRegionButton');
        expect(resetSmallRegionButton).toBeDefined()
    });

    // click on the reset button
    await fireEventAsync.press(getByTestId('resetSmallRegionButton'));
    await waitFor(() => {
        //expect the reset button to disappear
        const resetSmallRegionButton = queryAllByTestId('resetSmallRegionButton');
        expect(resetSmallRegionButton).toHaveLength(0);
    });
});

test('should drag the modal map', async () => {
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await screen.findByTestId('mapCard');

    const fullScreenButton = getByTestId('fullScreenButton');
    await fireEventAsync.press(fullScreenButton);
    await waitFor(() => {
        // check the full region is correct
        const fullRegion = getByTestId('mapCardFullRegion').props.region;
        expect(fullRegion.latitude).toBe(10.1);
        expect(fullRegion.longitude).toBe(5.5);
        expect(fullRegion.latitudeDelta).toBe(0.0222);
        expect(fullRegion.longitudeDelta).toBe(0.0222);

        const resetFullRegionButton = queryAllByTestId('resetFullRegionButton');
        expect(resetFullRegionButton).toHaveLength(0);
    });

    //simulate drag on the map
    await fireEventAsync(getByTestId('mapCardFullRegion'), 'onPanDrag', {
        coordinate: {
            latitude: 10.2,
            longitude: 5.6
        },
        position: {
            x: 100,
            y: 100
        }
    });
    await waitFor(() => {
        //expect the reset button to appear
        const resetFullRegionButton = getByTestId('resetFullRegionButton');
        expect(resetFullRegionButton).toBeDefined()
    });

    // click on the reset button

    await fireEventAsync.press(getByTestId('resetFullRegionButton'));
    await waitFor(() => {
        //expect the reset button to disappear
        const resetFullRegionButton = queryAllByTestId('resetFullRegionButton');
        expect(resetFullRegionButton).toHaveLength(0);
    });

    //close the modal 
    await fireEventAsync.press(getByTestId('closeModalButton'));
    await waitFor(() => {
        expect(queryAllByTestId('mapCardFullRegion')).toHaveLength(0);
    });
});

test('should load sateillite from localstorage', async () => {
    await AsyncStorage.setItem('appPreferences', JSON.stringify({
        mapType: 'hybridFlyover'
    }));
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
        const mapType = getByTestId('mapCardSmallRegion').props.mapType;
        expect(mapType).toBe('hybridFlyover');
    });
});

test('should change the map type', async () => {
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
        const mapType = getByTestId('mapCardSmallRegion').props.mapType;
        expect(mapType).toBe('standard');
    });
    // open the modal

    await fireEventAsync.press(getByTestId('fullScreenButton'));
    await waitFor(() => {
        expect(getByTestId('mapCardFullRegion')).toBeDefined();
        // check the standard button is outlined
        const standardButtonView = getByTestId('standardButtonView');
        expect(standardButtonView.props.style).toContainEqual(
            {
                borderColor: 'gray',
                backgroundColor: 'lightgray'
            });
        // check the satellite button is not outlined
        const satelliteButtonView = getByTestId('satelliteButtonView');
        expect(satelliteButtonView.props.style).toContainEqual(
            {
                borderColor: 'transparent',
                backgroundColor: 'white'
            });
    });

    // click on the satellite button
    await fireEventAsync.press(getByTestId('satelliteButton'));
    await waitFor(async () => {
        // check the satellite button is outlined
        const satelliteButtonView = getByTestId('satelliteButtonView');
        expect(satelliteButtonView.props.style).toContainEqual(
            {
                borderColor: 'gray',
                backgroundColor: 'lightgray'
            });
        // check the standard button is not outlined
        const standardButtonView = getByTestId('standardButtonView');
        expect(standardButtonView.props.style).toContainEqual(
            {
                borderColor: 'transparent',
                backgroundColor: 'white'
            });

        // check the change is persisted
        let appPreferences = await AsyncStorage.getItem('appPreferences');
        appPreferences = JSON.parse(appPreferences ?? '{}');
        expect(appPreferences).toMatchObject({
            mapType: 'hybridFlyover'
        });
    });

    // click on the standard button
    await fireEventAsync.press(getByTestId('standardButton'));
    await waitFor(async () => {
        // check the standard button is outlined
        const standardButtonView = getByTestId('standardButtonView');
        expect(standardButtonView.props.style).toContainEqual(
            {
                borderColor: 'gray',
                backgroundColor: 'lightgray'
            });
        // check the satellite button is not outlined
        const satelliteButtonView = getByTestId('satelliteButtonView');
        expect(satelliteButtonView.props.style).toContainEqual(
            {
                borderColor: 'transparent',
                backgroundColor: 'white'
            });

        // check the change is persisted
        let appPreferences = await AsyncStorage.getItem('appPreferences');
        appPreferences = JSON.parse(appPreferences ?? '{}');
        expect(appPreferences).toMatchObject({
            mapType: 'standard'
        });
    });
});

test('should open the map app on the phone', async () => {
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
        hasError: false,
        apiData: mockJSONLocation
    });
    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
    });

    // open the full screen modal
    await fireEventAsync.press(getByTestId('fullScreenButton'));
    await waitFor(() => {
        expect(getByTestId('mapCardFullRegion')).toBeDefined();
    });

    // click on the navigateToButton button
    await fireEventAsync.press(getByTestId('navigateToButton'));
    await waitFor(() => {
        expect(Linking.openURL).toHaveBeenLastCalledWith('maps://0,0?q=model1@10.1,5.5');
    });
});

test('should open on google maps if it is an android device', async () => {
    Platform.OS = 'android';
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
        hasError: false,
        apiData: mockJSONLocation
    });

    await waitFor(() => {
        expect(getByTestId('mapCard')).toBeDefined();
    });


    // open the full screen modal

    await fireEventAsync.press(getByTestId('fullScreenButton'));
    await waitFor(() => {
        expect(getByTestId('mapCardFullModal')).toBeDefined();
    });


    // click on the navigateToButton button

    await fireEventAsync.press(getByTestId('navigateToButton'));
    await waitFor(() => {
        expect(Linking.openURL).toHaveBeenLastCalledWith('geo:0,0?q=10.1,5.5(model1)');

    });
});