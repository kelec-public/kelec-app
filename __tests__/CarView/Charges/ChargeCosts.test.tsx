import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../../App";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import { Alert } from "react-native";
import { formatPrice } from "../../../src/packages/kelec-charge-cost";
import { isTabBarHidden } from "../../../testUtils/tabs";

jest.useFakeTimers();

beforeEach(async () => {
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount([account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
    await AsyncStorage.setItem('appPreferences', JSON.stringify({ highlightDCCharges: true }));
});

const mockGetBatteryStatus = jest.fn();
const mockGetChargesHistory = jest.fn();

jest.mock('../../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getLocation: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargesHistory: mockGetChargesHistory
        }
    });
});

jest.spyOn(Alert, 'alert').mockImplementation(() => { });


const mockJSONBatteryStatus = require('../mocks/mockRenaultBattery.json');
const mockJSONChargesHistory = require('../mocks/mockRenaultCharges.json');

const openHistory = async (user: ReturnType<typeof userEvent.setup>) => {
    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONBatteryStatus });
    mockGetChargesHistory.mockResolvedValueOnce({ hasError: false, apiData: mockJSONChargesHistory });
    render(<App />);
    await screen.findByTestId('ChargesCard');
    await user.press(screen.getByTestId('ChargesCard'));
    await screen.findByTestId('ChargesView');
};

test('should display the cost of the charges with the home tariff', async () => {
    await AsyncStorage.setItem('electricityTariffs', JSON.stringify({
        currency: 'EUR',
        tariffs: [{ id: 'flat', validFrom: null, kind: 'flat', pricePerKwh: 0.2 }],
    }));
    const user = userEvent.setup();
    await openHistory(user);

    // décembre 2023 (déplié) : 50 kWh puis 32,25 kWh à 0,20 €/kWh
    await waitFor(() => expect(screen.getAllByTestId('chargeCostText')).toHaveLength(2));
    const costs = screen.getAllByTestId('chargeCostText').map(text => text.props.children);
    expect(costs).toEqual([formatPrice(6.45, 'EUR'), formatPrice(10, 'EUR')]);
    const monthCosts = screen.getAllByTestId('chargeIndexCost').map(text => text.props.children[1]);
    expect(monthCosts).toEqual([formatPrice(16.45, 'EUR'), formatPrice(4.64, 'EUR')]);
    expect(screen.queryByTestId('setTariffBanner')).toBeNull();
});

test('without tariff: no cost, and an invitation to set one', async () => {
    const user = userEvent.setup();
    await openHistory(user);

    await screen.findByTestId('setTariffBanner');
    expect(screen.queryAllByTestId('chargeCostText')).toHaveLength(0);
    expect(screen.queryAllByTestId('chargeIndexCost')).toHaveLength(0);

    // la bannière ouvre les tarifs ; au retour, les coûts sont affichés
    await user.press(screen.getByTestId('setTariffBanner'));
    await screen.findByTestId('tariffListView');
    expect(isTabBarHidden()).toBe(false);
    await user.press(screen.getByTestId('addFirstTariffButton'));
    await screen.findByTestId('tariffEditorView');
    await user.type(screen.getByTestId('priceInputpricePerKwh'), '0,2');
    await user.press(screen.getByTestId('saveTariffButton'));
    await screen.findByTestId('tariffRow0');
    await user.press(screen.getByTestId('tariffListBackButton'));

    await waitFor(() => expect(screen.getAllByTestId('chargeCostText')).toHaveLength(2));
    expect(screen.queryByTestId('setTariffBanner')).toBeNull();
});

test('the options sheet opens the tariffs', async () => {
    const user = userEvent.setup();
    await openHistory(user);

    await user.press(screen.getByTestId('openModal'));
    await user.press(await screen.findByTestId('tariffButton'));
    await screen.findByTestId('tariffListView');
});
