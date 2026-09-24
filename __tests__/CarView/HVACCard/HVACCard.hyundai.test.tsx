import AsyncStorage from "@react-native-async-storage/async-storage";
import HyundaiCar from "../../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import App from "../../../App";
import { Alert } from "react-native";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import { use } from "react";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

const mockApiData = require('../mocks/mockHyundaiApiData.json');
const mockGetCarStatus = jest.fn();
const mockLaunchHVAC = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/hyundaiClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getCarStatus: mockGetCarStatus,
            launchHVAC: mockLaunchHVAC,
        }
    });
});

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

test('should render the HVAC card', async () => {

    render(<App />);

    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await screen.findByTestId('HVACCard');

});

test('should open and close the modal', async () => {
    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });
    await waitFor(() => {
        expect(screen.getByTestId('HVACCard')).toBeDefined();
    });
    // open modal

    await user.press(screen.getByTestId('HVACCardButton'));

    await waitFor(() => {
        expect(screen.getByTestId('HVACCardLowButton')).toBeDefined();
    });
    // close modal

    await user.press(screen.getByTestId('HVACModalCloseButton'));

    await waitFor(() => {
        expect(() => screen.getByTestId('HVACCardLowButton')).toThrow();
    });
});

test('should hit low and high temperature buttons', async () => {
    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(() => {
        expect(screen.getByTestId('HVACCard')).toBeDefined();
    });

    // open modal

    await user.press(screen.getByTestId('HVACCardButton'));


    // check both buttons are opacity 1
    const lowButton = screen.getByTestId('HVACCardLowButton');
    const lowButtonStyle = lowButton.props.style;
    expect(lowButtonStyle).toMatchObject({ "opacity": 1 });
    const highButton = screen.getByTestId('HVACCardHighButton');
    const highButtonStyle = highButton.props.style;
    expect(highButtonStyle).toMatchObject({ "opacity": 1 });

    // press low button until it's disabled

    await user.press(lowButton);
    await user.press(lowButton);
    await user.press(lowButton);
    await user.press(lowButton);

    await waitFor(() => {
        const temperatureText = screen.getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("LOW");
        expect(() => screen.getByTestId('degreeText')).toThrow();
    });

    // press high button until it's disabled

    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);
    await user.press(highButton);

    await waitFor(() => {
        const temperatureText = screen.getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("HIGH");
        expect(() => screen.getByTestId('degreeText')).toThrow();
    });
});



test('should launch hvac', async () => {
    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });
    mockLaunchHVAC.mockResolvedValueOnce(true);

    await waitFor(() => {
        expect(screen.getByTestId('HVACCard')).toBeDefined();
    });
    // open modal

    await user.press(screen.getByTestId('HVACCardButton'));

    // make sure the temp is set to default
    await waitFor(() => {
        const temperatureText = screen.getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("21");
    });
    // press confirm button

    await user.press(screen.getByTestId('confirmButton'));


    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenLastCalledWith("Informations envoyées", "Le préchauffage a été lancé");
    });

    // the modal should now be closed
    await waitFor(() => {
        expect(() => screen.getByTestId('HVACCardLowButton')).toThrow();
    });
});

test('should not load hvac', async () => {
    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });
    mockLaunchHVAC.mockResolvedValueOnce(false);

    await waitFor(() => {
        expect(screen.getByTestId('HVACCard')).toBeDefined();
    });

    // open modal

    await user.press(screen.getByTestId('HVACCardButton'));

    // make sure the temp is set to default
    await waitFor(() => {
        const temperatureText = screen.getByTestId('temperatureText');
        expect(temperatureText.props.children).toBe("21");
    });
    // press confirm button
    await user.press(screen.getByTestId('confirmButton'));


    await waitFor(async () => {
        expect(Alert.alert).toHaveBeenCalledTimes(2);
        expect(Alert.alert).toHaveBeenLastCalledWith("Erreur", "Erreur lors de l'envoi de la commande au serveur. Veuillez réessayer plus tard.");
    });

    // the modal should still be here
    await waitFor(() => {
        expect(screen.getByTestId('HVACCardLowButton')).toBeDefined();
    });
});  
test('should show hvac as running when airCtrlOn is true', async () => {
    const runningApiData = JSON.parse(JSON.stringify(mockApiData));
    runningApiData.vehicleStatus.airCtrlOn = true;

    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: runningApiData
    });

    await waitFor(() => {
        expect(screen.getByTestId('hvacRunningOverlay')).toBeDefined();
        expect(screen.getByTestId('animatedHvacIcon')).toBeDefined();
        expect(screen.queryAllByTestId('hvacIcon')).toHaveLength(0);
    });
});

test('should show hvac as off when airCtrlOn is false', async () => {
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(() => {
        expect(screen.getByTestId('hvacIcon')).toBeDefined();
    });
    expect(screen.queryAllByTestId('hvacRunningOverlay')).toHaveLength(0);
});
