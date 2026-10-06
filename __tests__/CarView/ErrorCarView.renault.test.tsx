import AsyncStorage from "@react-native-async-storage/async-storage";
import RenaultCar from "../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import App from "../../App";
import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";

jest.useFakeTimers();

beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount([account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});


const mockGetBatteryStatus = jest.fn();
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
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargeSettings: jest.fn().mockResolvedValue({
                hasError: true
            }),
        }
    });
});

test('should render view with account locked', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "account_locked"
    });
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("Compte verrouillé. Réessayez dans quelques minutes.");
    });
});

test('should render view with unauthorized car request', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "err.func.not.connected"
    });
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("L'accès aux données de ce véhicule n'est pas autorisé. Il faut d'abord l'appairer en utilisant l'application MyRenault.");
    });
});

test('should render view with too many requests', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "err.func.wired.overloaded"
    })
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("Trop de requêtes ont été effectuées. Veuillez réessayer plus tard.");
    });
});

test('should render view when privacy mode is on', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "err.func.privacy.on"
    })
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("Le mode privé est activé. Veuillez le désactiver sur l'écran de la voiture.");
    });
});

test('should render view when privacy mode is on alternative', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "err.func.wired.lkcd-authorization.failure"
    })
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("Le mode privé est activé. Veuillez le désactiver sur l'écran de la voiture.");
    });
});

test('should render view when data is not yet available', async () => {
    mockGetBatteryStatus.mockReturnValue({
        hasError: true,
        errorMessage: "err.func.wired.notFound"
    })
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("errorMessage").props.children).toBe("Les données ne sont pas encore disponibles pour votre véhicule. Si vous venez d'en prendre livraison, veuillez patienter quelques jours pour l'activation complète. Si votre véhicule est plus ancien, êtes-vous certain qu'il bénéficie d'un contrat de services connectés actif ?");
    });
});