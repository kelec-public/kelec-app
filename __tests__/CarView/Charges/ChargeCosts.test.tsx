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

test('should override the cost of a charge by hand, then go back to the tariff', async () => {
    await AsyncStorage.setItem('electricityTariffs', JSON.stringify({
        currency: 'EUR',
        tariffs: [{ id: 'flat', validFrom: null, kind: 'flat', pricePerKwh: 0.2 }],
    }));
    const user = userEvent.setup();
    await openHistory(user);
    await waitFor(() => expect(screen.getAllByTestId('chargeCostText')).toHaveLength(2));
    expect(screen.queryAllByTestId('manualCostIcon')).toHaveLength(0);

    // 1re charge affichée : 23 décembre 2023, 32,25 kWh (6,45 € au tarif) ; toute la carte ouvre le prix
    await user.press(screen.getAllByTestId('ChargeCard')[0]);
    await screen.findByTestId('chargeCostEditView');
    expect(screen.getByTestId('tariffCostText').props.children).toContain(formatPrice(6.45, 'EUR'));
    expect(screen.queryByTestId('resetChargeCostButton')).toBeNull();

    // montant invalide : refusé
    await user.press(screen.getByTestId('saveChargeCostButton'));
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.any(String));

    await user.type(screen.getByTestId('chargeCostInput'), '3,5');
    await user.press(screen.getByTestId('saveChargeCostButton'));

    await waitFor(() => expect(screen.queryByTestId('chargeCostEditView')).toBeNull());
    const costs = screen.getAllByTestId('chargeCostText').map(text => text.props.children);
    expect(costs).toEqual([formatPrice(3.5, 'EUR'), formatPrice(10, 'EUR')]);
    expect(screen.getAllByTestId('manualCostIcon')).toHaveLength(1);
    expect(screen.getAllByTestId('chargeIndexCost')[0].props.children[1]).toBe(formatPrice(13.5, 'EUR'));
    expect(JSON.parse(await AsyncStorage.getItem('vin1/chargeCostOverrides') ?? 'null')).toEqual([
        { chargeStartDate: '2023-12-23T14:59:12.000Z', amount: 3.5 },
    ]);

    // retour au tarif
    await user.press(screen.getAllByTestId('ChargeCard')[0]);
    await screen.findByTestId('chargeCostEditView');
    expect(screen.getByTestId('chargeCostInput').props.value).toBe('3.5');
    await user.press(screen.getByTestId('resetChargeCostButton'));

    await waitFor(() => expect(screen.queryByTestId('chargeCostEditView')).toBeNull());
    expect(screen.getAllByTestId('chargeCostText')[0].props.children).toBe(formatPrice(6.45, 'EUR'));
    expect(screen.queryAllByTestId('manualCostIcon')).toHaveLength(0);
    expect(JSON.parse(await AsyncStorage.getItem('vin1/chargeCostOverrides') ?? 'null')).toEqual([]);
});
