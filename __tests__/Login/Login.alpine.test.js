
import React from 'react';
import App from '../../App';
import { Alert } from 'react-native';

// Note: import explicitly to use the types shipped with jest.
import { it, expect, beforeEach } from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
jest.spyOn(Alert, 'alert').mockImplementation(() => { });


jest.useFakeTimers();


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

const mockGetKamereonAccount = jest.fn();
const mockCars = require('../AddView/mocks/mockRenaultCars.json');
const mockCarsAccount = jest.fn();
jest.mock('../../src/lib/clients/carMakers/renaultClient', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        return {
            getKamereonAccount: mockGetKamereonAccount,
            getVehicles: mockCarsAccount.mockResolvedValue({
                hasError: false,
                vehicles: mockCars.vehicleLinks
            })
        };
    })
}));





beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await AsyncStorage.clear();
});




it('should be able to login with alpine', async () => {
    mockGetKamereonAccount.mockResolvedValueOnce({
        canLogin: true,
        kamereonAccountID: "accountID",
        firstName: "Jean",
        lastName: "Dupont"
    })
    // loading the main app
    let component;
    await act(async () => {
        component = renderer.create(<App />);
    });
    const instance = component.root;

    // touch on alpine logo
    const alpineLogo = instance.findByProps({ testID: 'alpineLogo' });
    await act(async () => {
        alpineLogo.props.onPress();
    });


    const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
    expect(nextStepButton).toBeTruthy();
    await act(async () => {
        nextStepButton.props.onPress();
    });

    // empty localstorage so login should be displayed
    const loginButton = instance.findByProps({ testID: 'loginButton' });
    expect(loginButton).toBeTruthy();
    // we fill the email adress
    const emailInput = instance.findByProps({ testID: 'emailInput' });
    const passwordInput = instance.findByProps({ testID: 'passwordInput' });
    await act(async () => {
        emailInput.props.onChangeText('email@provider.com');
    });
    await act(async () => {
        passwordInput.props.onChangeText('password');
    });
    // try to login
    await act(async () => {
        loginButton.props.onPress();
    });

    // next screen should be open and cars should display
    const carList = instance.findAllByProps({ testID: 'carRowCard' });
    expect(carList).toBeTruthy();
    expect(mockCarsAccount).toHaveBeenCalledTimes(1);



    /*  expect(mockSaveNativeAccount).toHaveBeenCalledTimes(1); */

});

it('should display account locked', async () => {
    mockGetKamereonAccount.mockResolvedValueOnce({
        canLogin: false,
        errorMessage: "account_locked"
    });
    // loading the main app
    let component2;
    await act(async () => {
        component2 = renderer.create(<App />);
    });
    const instance = component2.root;

    // touch on alpine logo
    const alpineLogo = instance.findByProps({ testID: 'alpineLogo' });
    await act(async () => {
        alpineLogo.props.onPress();
    });


    const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
    expect(nextStepButton).toBeTruthy();
    await act(async () => {
        nextStepButton.props.onPress();
    });

    // empty localstorage so login should be displayed
    const loginButton = instance.findByProps({ testID: 'loginButton' });
    expect(loginButton).toBeTruthy();
    // we fill the email adress
    const emailInput = instance.findByProps({ testID: 'emailInput' });
    const passwordInput = instance.findByProps({ testID: 'passwordInput' });
    await act(async () => {
        emailInput.props.onChangeText('email@provider.com');
    });
    await act(async () => {
        passwordInput.props.onChangeText('password');
    });
    // try to login
    await act(async () => {
        loginButton.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Compte verrouillé. Réessayez dans quelques minutes.", [{ "text": "ok" }]);
    expect(mockCarsAccount).toHaveBeenCalledTimes(0);
});

it('should display invalid creds', async () => {
    mockGetKamereonAccount.mockResolvedValueOnce({
        canLogin: false,
        errorMessage: "invalid_credentials"
    })
    // loading the main app
    let component;
    await act(async () => {
        component = renderer.create(<App />);
    });
    const instance = component.root;

    // touch on alpine logo
    const alpineLogo = instance.findByProps({ testID: 'alpineLogo' });
    await act(async () => {
        alpineLogo.props.onPress();
    });


    const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
    expect(nextStepButton).toBeTruthy();
    await act(async () => {
        nextStepButton.props.onPress();
    });


    // empty localstorage so login should be displayed
    const loginButton = instance.findByProps({ testID: 'loginButton' });
    expect(loginButton).toBeTruthy();
    // we fill the email adress
    const emailInput = instance.findByProps({ testID: 'emailInput' });
    const passwordInput = instance.findByProps({ testID: 'passwordInput' });
    await act(async () => {
        emailInput.props.onChangeText('email@provider.com');
    });
    await act(async () => {
        passwordInput.props.onChangeText('password');
    });
    // try to login
    await act(async () => {
        loginButton.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Adresse mail ou mot de passe incorrect", [{ "text": "ok" }]);
    expect(mockCarsAccount).toHaveBeenCalledTimes(0);
});

it('should display server error', async () => {
    mockGetKamereonAccount.mockResolvedValueOnce({
        canLogin: false,
        errorMessage: "server_error"
    })
    // loading the main app
    let component;
    await act(async () => {
        component = renderer.create(<App />);
    });
    const instance = component.root;

    // touch on alpine logo
    const alpineLogo = instance.findByProps({ testID: 'alpineLogo' });
    await act(async () => {
        alpineLogo.props.onPress();
    });


    const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
    expect(nextStepButton).toBeTruthy();
    await act(async () => {
        nextStepButton.props.onPress();
    });


    // empty localstorage so login should be displayed
    const loginButton = instance.findByProps({ testID: 'loginButton' });
    expect(loginButton).toBeTruthy();
    // we fill the email adress
    const emailInput = instance.findByProps({ testID: 'emailInput' });
    const passwordInput = instance.findByProps({ testID: 'passwordInput' });
    await act(async () => {
        emailInput.props.onChangeText('email@provider.com');
    });
    await act(async () => {
        passwordInput.props.onChangeText('password');
    });
    // try to login
    await act(async () => {
        loginButton.props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith("Erreur", "Erreur serveur", [{ "text": "ok" }]);
    expect(mockCarsAccount).toHaveBeenCalledTimes(0);
});