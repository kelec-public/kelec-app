import { fireEvent, render, waitFor } from "@testing-library/react-native";
import TfaView, { TfaOrigin } from "../../src/packages/kelec-login/views/Steps/Step2/Tfa/TfaView";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../src/packages/kelec-login/views/LoginEntryView";
import MainContext from "../../src/lib/Contexts/MainContext";
import { act } from "react";
import { Alert } from "react-native";
import { TFA_ERRORS } from "../../src/lib/clients/carMakers/renault/renaultTfaClient";
import { setupThemes } from '../../__mocks__/theme-mock-helper';

const mockUseTheme = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useTheme: () => mockUseTheme(),
}));

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const themes = setupThemes(mockUseColorScheme);
beforeEach(() => {
  mockUseTheme.mockReturnValue(themes.getLight());
});

jest.spyOn(Alert, 'alert');

const tfaClientMock = {
    getDeviceId: jest.fn().mockResolvedValue(undefined),
    initTfaSequence: jest.fn().mockResolvedValue(undefined),
    getTfaEmails: jest.fn().mockResolvedValue({ obfuscated: 'j***@example.com' }),
    sendTfaCode: jest.fn().mockResolvedValue(undefined),
    validateTfaCode: jest.fn().mockResolvedValue(undefined),
    finalizeTfa: jest.fn().mockResolvedValue(undefined),
    finalizeRegistration: jest.fn().mockResolvedValue(undefined),
};

jest.mock("../../src/lib/clients/carMakers/renault/renaultTfaClient", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => tfaClientMock),
        TFA_ERRORS: {
            WRONG_VERIFICATION_CODE: 'WRONG_VERIFICATION_CODE',
            MAXIMUM_VERIFICATION_EXCEEDED: 'MAXIMUM_VERIFICATION_EXCEEDED',
        },
    };
});

const onTfaCompletedMock = jest.fn();

const mockLanguageHandler = {
    getTranslation: (key: string) => key,
};
const mockContextValue = {
    languageHandler: mockLanguageHandler,
};

const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    dispatch: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
} as unknown as NativeStackNavigationProp<
    LoginEntryParamList,
    'TfaView'
>;


const mockRoute = {
    key: 'TfaView-test',
    name: 'TfaView' as const,
    params: {
        regToken: 'fake-reg-token-123',
        origin: TfaOrigin.ADD_CAR_FLOW,
    },
};

afterEach(() => {
    jest.useRealTimers();
});

describe('TfaView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Réinitialiser les implémentations par défaut après clearAllMocks
        tfaClientMock.getDeviceId.mockResolvedValue(undefined);
        tfaClientMock.initTfaSequence.mockResolvedValue(undefined);
        tfaClientMock.getTfaEmails.mockResolvedValue({ obfuscated: 'j***@example.com' });
        tfaClientMock.sendTfaCode.mockResolvedValue(undefined);
        tfaClientMock.validateTfaCode.mockResolvedValue(undefined);
        tfaClientMock.finalizeTfa.mockResolvedValue(undefined);
        tfaClientMock.finalizeRegistration.mockResolvedValue(undefined);
    });

    test('enters code successfully', async () => {
        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={mockRoute}></TfaView>
            </MainContext.Provider>
        );

        await waitFor(async () => {
            // on devrait voir la vue de saisie du code
            const tfaCodeInput = getByTestId('tfaCodeInput', { includeHiddenElements: true });
            expect(tfaCodeInput).toBeTruthy();

            // on simule la saisie du code à 6 chiffres
            const code = '123456';
            tfaClientMock.validateTfaCode.mockResolvedValueOnce(undefined); // validation réussie
            await act(async () => {
                fireEvent.changeText(tfaCodeInput, code);
            });
        });

        const tfaNextButton = getByTestId('tfaNextButton');
        expect(tfaNextButton).toBeTruthy();

        await act(async () => {
            fireEvent.press(tfaNextButton);
        });

        // on devrait pouvoir apputer sur suivant
        await waitFor(() => {
            expect(tfaClientMock.validateTfaCode).toHaveBeenCalledWith('123456');
            expect(onTfaCompletedMock).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('youLlBeRedirectedToPreviousScreenClickNext');
        });
    });

    test('enters code succesfully from car page', async () => {
        const customRoute = {
            ...mockRoute,
            params: {
                regToken: 'fake-reg-token-123',
                origin: TfaOrigin.CAR_PAGE,
            },
        };

        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={customRoute}></TfaView>
            </MainContext.Provider>
        );

        await waitFor(async () => {
            // on devrait voir la vue de saisie du code
            const tfaCodeInput = getByTestId('tfaCodeInput', { includeHiddenElements: true });
            expect(tfaCodeInput).toBeTruthy();

            // on simule la saisie du code à 6 chiffres
            const code = '123456';
            tfaClientMock.validateTfaCode.mockResolvedValueOnce(undefined); // validation réussie
            await act(async () => {
                fireEvent.changeText(tfaCodeInput, code);
            });
        });

        const tfaNextButton = getByTestId('tfaNextButton');
        expect(tfaNextButton).toBeTruthy();

        await act(async () => {
            fireEvent.press(tfaNextButton);
        });

        // on devrait pouvoir apputer sur suivant
        await waitFor(() => {
            expect(tfaClientMock.validateTfaCode).toHaveBeenCalledWith('123456');
            expect(onTfaCompletedMock).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('pullToRefreshCarData');
        });
    });

    test('code generation doesn\'t work', async () => {
        // on simule une erreur lors de l'envoi du code
        tfaClientMock.sendTfaCode.mockRejectedValueOnce(new Error('Failed to send code'));


        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={mockRoute}></TfaView>
            </MainContext.Provider>
        );

        await waitFor(async () => {

            const TFAErrorPopUp = getByTestId('TFAErrorPopUp');
            expect(TFAErrorPopUp).toBeTruthy();
        });
    });

    test('code validation doesn\'t work', async () => {
        tfaClientMock.validateTfaCode.mockRejectedValueOnce(new Error(TFA_ERRORS.WRONG_VERIFICATION_CODE)); // validation échouée

        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={mockRoute}></TfaView>
            </MainContext.Provider>
        );

        await waitFor(async () => {
            // on devrait voir la vue de saisie du code
            const tfaCodeInput = getByTestId('tfaCodeInput', { includeHiddenElements: true });
            expect(tfaCodeInput).toBeTruthy();

            // on simule la saisie du code à 6 chiffres
            const code = '123456';
            await act(async () => {
                fireEvent.changeText(tfaCodeInput, code);
            });
        });

        const tfaNextButton = getByTestId('tfaNextButton');
        expect(tfaNextButton).toBeTruthy();

        await act(async () => {
            fireEvent.press(tfaNextButton);
        });

        await waitFor(() => {
            expect(tfaClientMock.validateTfaCode).toHaveBeenCalledWith('123456');
            expect(Alert.alert).toHaveBeenCalledWith('incorrectCode');
        });
    });

    test('maximum validation attempts exceeded', async () => {
        tfaClientMock.validateTfaCode.mockRejectedValueOnce(new Error(TFA_ERRORS.MAXIMUM_VERIFICATION_EXCEEDED)); // validation échouée 

        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={mockRoute}></TfaView>
            </MainContext.Provider>
        );

        await waitFor(async () => {
            // on devrait voir la vue de saisie du code
            const tfaCodeInput = getByTestId('tfaCodeInput', { includeHiddenElements: true });
            expect(tfaCodeInput).toBeTruthy();

            // on simule la saisie du code à 6 chiffres
            const code = '123456';
            await act(async () => {
                fireEvent.changeText(tfaCodeInput, code);
            });
        });

        const tfaNextButton = getByTestId('tfaNextButton');
        expect(tfaNextButton).toBeTruthy();

        await act(async () => {
            fireEvent.press(tfaNextButton);
        });

        await waitFor(() => {
            expect(tfaClientMock.validateTfaCode).toHaveBeenCalledWith('123456');
            expect(Alert.alert).toHaveBeenCalledWith('maximumAllowedTriesExceeded');
        });
    });

    test('resend code works', async () => {
        jest.useFakeTimers();

        const { getByTestId } = render(
            <MainContext.Provider value={mockContextValue as any}><TfaView
                onTfaCompleted={onTfaCompletedMock}
                navigation={mockNavigation}
                route={mockRoute}></TfaView>
            </MainContext.Provider>
        );

        // le bouton ne doit pas être visible au début
        await waitFor(() => {
            expect(() => getByTestId('resendCodeButton')).toThrow();
        });


        // Avancer le temps pour écouler le cooldown de 10s
        await act(async () => {
            jest.advanceTimersByTime(11000);
        });

        await waitFor(() => {
            expect(getByTestId('resendCodeButton')).toBeTruthy();
        });

        const resendButton = getByTestId('resendCodeButton');
        await act(async () => {
            fireEvent.press(resendButton);
        });

        await waitFor(() => {
            expect(tfaClientMock.sendTfaCode).toHaveBeenCalledTimes(2);
        });

    });

});