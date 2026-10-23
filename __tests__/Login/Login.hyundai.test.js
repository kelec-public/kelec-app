

import App from '../../App';
import { Alert } from 'react-native';


import AsyncStorage from '@react-native-async-storage/async-storage';

import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { render, userEvent, waitFor, screen } from '@testing-library/react-native';
jest.spyOn(Alert, 'alert').mockImplementation(() => { });


jest.useFakeTimers();

const mockCheckAuthorised = jest.fn();
const mockCheckLogin = jest.fn();
const mockGetVehicles = jest.fn();
jest.mock('../../src/lib/clients/carMakers/hyundaiClient', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        return {
            checkAuthorised: mockCheckAuthorised,
            checkLogin: mockCheckLogin,
            getVehicles: mockGetVehicles.mockResolvedValue({
                hasError: false,
                vehicles: []
            })
        };
    })
}));


const mockSaveNativeAccount = jest.fn();
const mockSaveNativeImage = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockImplementation(mockSaveNativeImage);


let mockImageFetch = jest.fn()
jest.mock('../../src/lib/graphics/imageFetcher', () => {
    return jest.fn().mockImplementation(() => {
        return Promise.resolve(mockImageFetch());
    });
});


beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await AsyncStorage.clear();
});



it('should be able to login with hyundai', async () => {
    const user = userEvent.setup();

    mockCheckAuthorised.mockResolvedValueOnce(true);
    mockCheckLogin.mockResolvedValueOnce(true);
    // loading the main app
    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });

    // touch on hyundai logo
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);

    // we fill the email adress
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    await user.type(emailInput, 'email@provider.com');
    await user.type(passwordInput, 'password');

    // try to login
    const loginButton = screen.getByTestId('loginButton');
    await user.press(loginButton);

    await waitFor(() => {
        // next screen should be open and cars should display
        expect(mockGetVehicles).toHaveBeenCalledTimes(1);
        const addViewSelector = screen.getAllByTestId('addViewSelector');
        expect(addViewSelector).toBeTruthy();

    });

});

it('should display not authorised yet', async () => {
    const user = userEvent.setup();
    mockCheckAuthorised.mockResolvedValueOnce(false);
    // loading the main app
    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });

    // touch on hyundai logo
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);


    // we fill the email adress
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    await user.type(emailInput, 'email@provider.com');
    await user.type(passwordInput, 'password');

    const loginButton = screen.getByTestId('loginButton');
    await user.press(loginButton);

    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Not yet available", [{ "text": "ok" }]);
        expect(mockGetVehicles).toHaveBeenCalledTimes(0);
    });

});


it('should display incorrect credentials', async () => {
    const user = userEvent.setup();

    mockCheckAuthorised.mockResolvedValueOnce(true);
    mockCheckLogin.mockResolvedValueOnce(false);
    // loading the main app
    render(<App />);

    await waitFor(() => {
        expect(screen.getByTestId('loginView')).toBeTruthy();
    });


    // touch on hyundai logo
    const hyundaiLogo = screen.getByTestId('hyundaiLogo');
    await user.press(hyundaiLogo);
    const nextStepButton = screen.getByTestId('nextStepButton');
    await user.press(nextStepButton);

    // we fill the email adress
    const emailInput = screen.getByTestId('emailInput');
    const passwordInput = screen.getByTestId('passwordInput');
    await user.type(emailInput, 'email@provider.com');
    await user.type(passwordInput, 'password');

    const loginButton = screen.getByTestId('loginButton');
    await user.press(loginButton);

    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Adresse mail ou mot de passe incorrect", [{ "text": "ok" }]);
        expect(mockGetVehicles).toHaveBeenCalledTimes(0);
    });
});
