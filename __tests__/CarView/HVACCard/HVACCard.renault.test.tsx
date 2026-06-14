import AsyncStorage from "@react-native-async-storage/async-storage";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import { render, waitFor, fireEventAsync } from "@testing-library/react-native";
import App from "../../../App";
import React from "react";
import { Alert } from "react-native";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
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
const mockLaunchHVAC = jest.fn();
const mockGetHVACStatus = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: mockGetCockpitStatus,
            getLocation: jest.fn().mockImplementation(() => {
                return {
                    hasError: true
                }
            }),
            launchHVAC: mockLaunchHVAC,
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getHVACStatus: mockGetHVACStatus,
            getChargeSettings: jest.fn().mockResolvedValue({ hasError: true }),
        }
    });
});

const mockJSONBatteryStatus = require('../mocks/mockRenaultBattery.json');
const mockJSONCockpit = require('../mocks/mockRenaultCockpit.json');
const mockJSONHVACStatus = require('../mocks/mockRenaultHVACStatus.json');


jest.spyOn(Alert, 'alert').mockImplementation(() => { });

test('should render the HVAC card', async () => {
    const { getByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
});


test('should open and close the modal', async () => {
    const { getByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
    // open modal
    await fireEventAsync.press(getByTestId('HVACCardButton'));
    await waitFor(() => {
        expect(getByTestId('HVACCardLowButton')).toBeDefined();
    });
    // close modal
    await fireEventAsync.press(getByTestId('HVACModalCloseButton'));

    await waitFor(() => {
        expect(() => getByTestId('HVACCardLowButton')).toThrow();
    });
});

test('should hit low and high temperature buttons', async () => {
    const { getByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
    // open modal
    await fireEventAsync.press(getByTestId('HVACCardButton'));

    // check both buttons are opacity 1
    const lowButton = getByTestId('HVACCardLowButton');
    const lowButtonStyle = lowButton.props.style;
    expect(lowButtonStyle).toMatchObject({ "opacity": 1 });
    const highButton = getByTestId('HVACCardHighButton');
    const highButtonStyle = highButton.props.style;
    expect(highButtonStyle).toMatchObject({ "opacity": 1 });

    // press low button until it's disabled
    await fireEventAsync.press(lowButton);
    await fireEventAsync.press(lowButton);
    await fireEventAsync.press(lowButton);
    await fireEventAsync.press(lowButton);

    await waitFor(() => {
        const temperatureText = getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("LOW");
        const lowButtonDisabled = getByTestId('HVACCardLowButton');
        //degreeText should not be displayed
        expect(() => getByTestId('degreeText')).toThrow();
    });

    // press high button until it's disabled
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);
    await fireEventAsync.press(highButton);

    await waitFor(() => {
        const temperatureText = getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("HIGH");
        const highButtonDisabled = getByTestId('HVACCardHighButton');
        const highButtonDisabledStyle = highButtonDisabled.props.style;
        /* expect(highButtonDisabledStyle).toMatchObject({ "opacity": 0.4 }); */
        //degreeText should be displayed
        expect(() => getByTestId('degreeText')).toThrow();
    });
});

test('should launch hvac', async () => {
    const { getByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockLaunchHVAC.mockResolvedValueOnce(true);

    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
    // open modal
    await fireEventAsync.press(getByTestId('HVACCardButton'));
    // make sure the temp is set to default
    await waitFor(() => {
        const temperatureText = getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("21");
    });
    // press confirm button
    await fireEventAsync.press(getByTestId('confirmButton'));

    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenLastCalledWith("Informations envoyées", "Le préchauffage a été lancé");
    });

    // the modal should now be closed
    await waitFor(() => {
        expect(() => getByTestId('HVACCardLowButton')).toThrow();
    });
});

test('should not load hvac', async () => {
    const { getByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockLaunchHVAC.mockResolvedValueOnce(false);
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
    });
    // open modal
    await fireEventAsync.press(getByTestId('HVACCardButton'));
    // make sure the temp is set to default
    await waitFor(() => {
        const temperatureText = getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("21");
    });
    // press confirm button
    await fireEventAsync.press(getByTestId('confirmButton'));

    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(2);
        expect(Alert.alert).toHaveBeenLastCalledWith("Erreur", "Erreur lors de l'envoi de la commande au serveur. Veuillez réessayer plus tard.");
    });

    // the modal should still be here
    await waitFor(() => {
        expect(getByTestId('HVACCardLowButton')).toBeDefined();
    });
});

test('should hvac be off', async () => {
    const { getByTestId, queryAllByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONHVACStatus
    });
    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
        expect(getByTestId('hvacIcon')).toBeDefined();
        const amountOfAnimatedIcons = queryAllByTestId('animatedHvacIcon');
        expect(amountOfAnimatedIcons).toHaveLength(0);
        const amountOfOverlays = queryAllByTestId('hvacRunningOverlay');
        expect(amountOfOverlays).toHaveLength(0);
    });
});

test('should hvac be on', async () => {
    const { getByTestId, queryAllByTestId } = render(<App />);
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetCockpitStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONCockpit
    });
    const mockHVACData = mockJSONHVACStatus;
    mockHVACData.hvacStatus = "on";
    mockGetHVACStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockHVACData
    });

    await waitFor(() => {
        expect(getByTestId('HVACCard')).toBeDefined();
        const amountOfIcons = queryAllByTestId('hvacIcon');
        expect(amountOfIcons).toHaveLength(0);
        expect(getByTestId('hvacRunningOverlay')).toBeDefined();
        expect(getByTestId('animatedHvacIcon')).toBeDefined();
    });
});