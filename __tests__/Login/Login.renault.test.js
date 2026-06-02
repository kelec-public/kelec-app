import React from 'react';
import App from '../../App';
import { Alert } from 'react-native';

import { it, expect, beforeEach } from '@jest/globals';

import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { CarMaker } from '../../src/lib/clients/accounts/account';
jest.spyOn(Alert, 'alert').mockImplementation(() => { });

jest.useFakeTimers();

const mockSaveNativeAccount = jest.fn();
const mockSaveNativeImage = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
jest.spyOn(sharedPlatformsData, 'saveNativeImage').mockImplementation(mockSaveNativeImage);

let mockImageFetch = jest.fn();
jest.mock('../../src/lib/graphics/imageFetcher', () => {
    return jest.fn().mockImplementation(() => {
        return Promise.resolve(mockImageFetch());
    });
});

// jest.mock est hissé avant les déclarations const/let — les variables externes
// seraient undefined dans la factory. On définit les jest.fn() directement
// à l'intérieur, et on récupère les références via require() plus bas.
jest.mock('../../src/packages/kelec-login/oidc/oidc', () => ({
    __esModule: true,
    default: {
        generateRandomString: jest.fn().mockReturnValue('mock-state'),
        exchangeToken: jest.fn(),
        saveTokens: jest.fn().mockResolvedValue(undefined),
        getTokens: jest.fn().mockResolvedValue(null),
    }
}));

jest.mock('../../src/lib/clients/carMakers/newRenaultClient', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getKamereonAccount: jest.fn(),
        getVehicles: jest.fn(),
    }))
}));

const mockCars = require('../AddView/mocks/mockRenaultCars.json');

beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await AsyncStorage.clear();
});

describe('Login flow with Renault', () => {
    const renaultGroupBrands = [
        CarMaker.ALPINE, CarMaker.DACIA, CarMaker.RENAULT
    ]

    for (const brand of renaultGroupBrands) {
        it('should be able to login with renault', async () => {
            // Récupérer les références aux mocks après hoisting
            const OIDC = require('../../src/packages/kelec-login/oidc/oidc').default;
            const NewRenaultClient = require('../../src/lib/clients/carMakers/newRenaultClient').default;

            OIDC.exchangeToken.mockResolvedValueOnce({
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                id_token: 'mock-id-token',
                token_type: 'Bearer',
                expires_in: 3600,
                email: 'email@provider.com',
                personId: 'mock-person-id',
            });

            // Configurer le mock NewRenaultClient pour cette instance
            // getVehicles() retourne le tableau directement (pas un objet wrappé)
            NewRenaultClient.mockImplementation(() => ({
                getKamereonAccount: jest.fn().mockResolvedValueOnce({
                    canLogin: true,
                    kamereonAccountID: 'accountID',
                    firstName: 'Jean',
                    lastName: 'Dupont',
                }),
                getVehicles: jest.fn().mockResolvedValue(mockCars.vehicleLinks),
            }));

            let component;
            await act(async () => {
                component = renderer.create(<App />);
            });
            const instance = component.root;

            // Sélectionner Renault
            const renaultLogo = instance.findByProps({ testID: `${brand}Logo` });
            await act(async () => {
                renaultLogo.props.onPress();
            });

            // Appuyer sur suivant → navigue vers OidcLoginView (WebView)
            const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
            expect(nextStepButton).toBeTruthy();
            await act(async () => {
                nextStepButton.props.onPress();
            });

            // Attendre que buildAuthState() resolve et que le WebView soit rendu
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            // Simuler le callback de redirect OIDC depuis le WebView
            // authState.state = 'mock-state' car OIDC.generateRandomString est mocké à 'mock-state'
            const WebView = require('react-native-webview').default;
            const webView = instance.findByType(WebView);
            await act(async () => {
                webView.props.onNavigationStateChange({
                    url: `?code=mock-auth-code&state=mock-state`
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            // La liste de voitures doit être affichée
            const carList = instance.findAllByProps({ testID: 'carRowCard' });
            expect(carList.length).toBeGreaterThan(0);
            expect(OIDC.exchangeToken).toHaveBeenCalledWith('mock-auth-code', 'mock-state');
            expect(NewRenaultClient).toHaveBeenCalledTimes(2); // 1 pour getKamereonAccount, 1 pour getVehicles
        });

        it('should display error when oidc flow', async () => {
            const OIDC = require('../../src/packages/kelec-login/oidc/oidc').default;
            const NewRenaultClient = require('../../src/lib/clients/carMakers/newRenaultClient').default;

            let component;
            await act(async () => {
                component = renderer.create(<App />);
            });
            const instance = component.root;

            const renaultLogo = instance.findByProps({ testID: `${brand}Logo` });
            await act(async () => {
                renaultLogo.props.onPress();
            });

            // Appuyer sur suivant → navigue vers OidcLoginView (WebView)
            const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
            expect(nextStepButton).toBeTruthy();
            await act(async () => {
                nextStepButton.props.onPress();
            });

            // Attendre que buildAuthState() resolve et que le WebView soit rendu
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            // Simuler le callback de redirect OIDC depuis le WebView
            // authState.state = 'mock-state' car OIDC.generateRandomString est mocké à 'mock-state'
            const WebView = require('react-native-webview').default;
            const webView = instance.findByType(WebView);
            await act(async () => {
                webView.props.onNavigationStateChange({
                    url: `?error=access_denied`
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            // on doit avoir eu la popup
            expect(Alert.alert).toHaveBeenCalledWith('OIDC error: access_denied');
            // on doit être revenu sur la page de choix de la marque
            expect(instance.findByProps({ testID: 'carMakerSelectView' })).toBeTruthy();
        });

        it('should display error when oidc flow no code or auth state', async () => {
            const OIDC = require('../../src/packages/kelec-login/oidc/oidc').default;
            const NewRenaultClient = require('../../src/lib/clients/carMakers/newRenaultClient').default;

            let component;
            await act(async () => {
                component = renderer.create(<App />);
            });
            const instance = component.root;

            const renaultLogo = instance.findByProps({ testID: `${brand}Logo` });
            await act(async () => {
                renaultLogo.props.onPress();
            });

            // Appuyer sur suivant → navigue vers OidcLoginView (WebView)
            const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
            expect(nextStepButton).toBeTruthy();
            await act(async () => {
                nextStepButton.props.onPress();
            });

            // Attendre que buildAuthState() resolve et que le WebView soit rendu
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            // Simuler le callback de redirect OIDC depuis le WebView
            // authState.state = 'mock-state' car OIDC.generateRandomString est mocké à 'mock-state'
            const WebView = require('react-native-webview').default;
            const webView = instance.findByType(WebView);
            await act(async () => {
                webView.props.onNavigationStateChange({
                    url: `?nodata`
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            // on doit avoir eu la popup
            expect(Alert.alert).toHaveBeenCalledWith('MISSING_CODE_OR_STATE');
            // on doit être revenu sur la page de choix de la marque
            expect(instance.findByProps({ testID: 'carMakerSelectView' })).toBeTruthy();
        });

        it('should display error when oidc flow invalid state', async () => {
            const OIDC = require('../../src/packages/kelec-login/oidc/oidc').default;
            const NewRenaultClient = require('../../src/lib/clients/carMakers/newRenaultClient').default;

            let component;
            await act(async () => {
                component = renderer.create(<App />);
            });
            const instance = component.root;

            const renaultLogo = instance.findByProps({ testID: `${brand}Logo` });
            await act(async () => {
                renaultLogo.props.onPress();
            });

            // Appuyer sur suivant → navigue vers OidcLoginView (WebView)
            const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
            expect(nextStepButton).toBeTruthy();
            await act(async () => {
                nextStepButton.props.onPress();
            });

            // Attendre que buildAuthState() resolve et que le WebView soit rendu
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            // Simuler le callback de redirect OIDC depuis le WebView
            // authState.state = 'mock-state' car OIDC.generateRandomString est mocké à 'mock-state'
            const WebView = require('react-native-webview').default;
            const webView = instance.findByType(WebView);
            await act(async () => {
                webView.props.onNavigationStateChange({
                    url: `?code=mock-auth-code&state=invalid_state`
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            // on doit avoir eu la popup
            expect(Alert.alert).toHaveBeenCalledWith('INVALID_RETURNED_STATE');
            // on doit être revenu sur la page de choix de la marque
            expect(instance.findByProps({ testID: 'carMakerSelectView' })).toBeTruthy();
        });

        it('should not be able to get kamareon account id', async () => {
            // Récupérer les références aux mocks après hoisting
            const OIDC = require('../../src/packages/kelec-login/oidc/oidc').default;
            const NewRenaultClient = require('../../src/lib/clients/carMakers/newRenaultClient').default;

            OIDC.exchangeToken.mockResolvedValueOnce({
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                id_token: 'mock-id-token',
                token_type: 'Bearer',
                expires_in: 3600,
                email: 'email@provider.com',
                personId: 'mock-person-id',
            });

            // Configurer le mock NewRenaultClient pour cette instance
            // getVehicles() retourne le tableau directement (pas un objet wrappé)
            NewRenaultClient.mockImplementation(() => ({
                getKamereonAccount: jest.fn().mockResolvedValueOnce({
                    canLogin: false,
                    errorMessage: 'Unable to retrieve Kamereon account ID',
                }),
            }));

            let component;
            await act(async () => {
                component = renderer.create(<App />);
            });
            const instance = component.root;

            // Sélectionner Renault
            const renaultLogo = instance.findByProps({ testID: `${brand}Logo` });
            await act(async () => {
                renaultLogo.props.onPress();
            });

            // Appuyer sur suivant → navigue vers OidcLoginView (WebView)
            const nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
            expect(nextStepButton).toBeTruthy();
            await act(async () => {
                nextStepButton.props.onPress();
            });

            // Attendre que buildAuthState() resolve et que le WebView soit rendu
            await act(async () => {
                await Promise.resolve();
                await Promise.resolve();
            });

            // Simuler le callback de redirect OIDC depuis le WebView
            // authState.state = 'mock-state' car OIDC.generateRandomString est mocké à 'mock-state'
            const WebView = require('react-native-webview').default;
            const webView = instance.findByType(WebView);
            await act(async () => {
                webView.props.onNavigationStateChange({
                    url: `?code=mock-auth-code&state=mock-state`
                });
                await Promise.resolve();
                await Promise.resolve();
            });

            // on doit avoir eu la popup
            expect(Alert.alert).toHaveBeenCalledWith('Unable to retrieve Kamereon account ID: Unable to retrieve Kamereon account ID');
            // on doit être revenu sur la page de choix de la marque
            expect(instance.findByProps({ testID: 'carMakerSelectView' })).toBeTruthy();
        });
    }
});


