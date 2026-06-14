import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import RenaultCar from "../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import { Alert } from "react-native";
import LanguageHandler from "../../src/lib/model/localization/languageHandler";

jest.useFakeTimers();

beforeEach(async () => {
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
    await AsyncStorage.setItem('appPreferences', JSON.stringify({ highlightDCCharges: true }));
});

const mockGetBatteryStatus = jest.fn();
const mockGetChargesHistory = jest.fn();

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
            getChargesHistory: mockGetChargesHistory
        }
    });
});

jest.spyOn(Alert, 'alert').mockImplementation(() => { });


const mockJSONBatteryStatus = require('./mocks/mockRenaultBattery.json');
const mockJSONChargesHistory = require('./mocks/mockRenaultCharges.json');

test('should render the charges view', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId('ChargesCard');

    await user.press(screen.getByTestId('ChargesCard'));
    await screen.findByTestId('ChargesView');

    const chargeIndexArrow = screen.getAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);

    await screen.findAllByTestId('chargeIndexTitle');
    // check indexes from new to old
    let ChargesIndexTitles = screen.queryAllByTestId('chargeIndexTitle');
    expect(ChargesIndexTitles).toHaveLength(2);
    expect(ChargesIndexTitles[0].props.children).toBe('Décembre 2023');
    expect(ChargesIndexTitles[1].props.children).toBe('Novembre 2023');
    // check total energy charged
    let chargeIndexEnergyRecovered = screen.queryAllByTestId('chargeIndexEnergyRecovered');
    expect(chargeIndexEnergyRecovered).toHaveLength(2);
    expect(chargeIndexEnergyRecovered[0].props.children[0]).toBe(82.25); // 32.25 + 50
    expect(chargeIndexEnergyRecovered[1].props.children[0]).toBe(23.20); // 23.20
    // check total time charged
    let chargeIndexTimeCharged = screen.queryAllByTestId('chargeIndexTimeCharged');
    expect(chargeIndexTimeCharged).toHaveLength(2);
    expect(chargeIndexTimeCharged[0].props.children[0]).toBe("09");
    expect(chargeIndexTimeCharged[0].props.children[2]).toBe("58"); // 543 + 55 minutes = 9h 58m
    expect(chargeIndexTimeCharged[1].props.children[0]).toBe("06");
    expect(chargeIndexTimeCharged[1].props.children[2]).toBe("28"); // 388 minutes = 6h28
    let ChargesCard = screen.queryAllByTestId('ChargeCard');
    expect(ChargesCard).toHaveLength(3);

    // check mileage buttons
    const inaccurateMileageButton = screen.queryAllByTestId('inaccurateMileageButton');
    expect(inaccurateMileageButton).toHaveLength(1);
    await user.press(inaccurateMileageButton[0]);
    await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledTimes(1);
        expect(Alert.alert).toHaveBeenCalledWith(new LanguageHandler().getTranslation('inaccurate_mileage'), new LanguageHandler().getTranslation('inaccurate_mileage_alert'));
    });

    // now let's invert the order
    const openModal = await screen.findByTestId('openModal');
    await user.press(openModal);

    await screen.findByTestId('chargesViewModal');

    const invertOrder = await screen.findByTestId('sortButton');
    await user.press(invertOrder);

    //now let's check the order
    ChargesIndexTitles = await screen.findAllByTestId('chargeIndexTitle');
    expect(ChargesIndexTitles).toHaveLength(2);
    expect(ChargesIndexTitles[0].props.children).toBe('Novembre 2023');
    expect(ChargesIndexTitles[1].props.children).toBe('Décembre 2023');
    // check total energy charged
    chargeIndexEnergyRecovered = screen.queryAllByTestId('chargeIndexEnergyRecovered');
    expect(chargeIndexEnergyRecovered).toHaveLength(2);
    expect(chargeIndexEnergyRecovered[0].props.children[0]).toBe(23.20); // 23.20
    expect(chargeIndexEnergyRecovered[1].props.children[0]).toBe(82.25); // 32.25 + 50
    // check total time charged
    chargeIndexTimeCharged = screen.queryAllByTestId('chargeIndexTimeCharged');
    expect(chargeIndexTimeCharged).toHaveLength(2);
    expect(chargeIndexTimeCharged[0].props.children[0]).toBe("06");
    expect(chargeIndexTimeCharged[0].props.children[2]).toBe("28"); // 388 minutes = 6h28
    expect(chargeIndexTimeCharged[1].props.children[0]).toBe("09");
    expect(chargeIndexTimeCharged[1].props.children[2]).toBe("58"); // 543 + 55 minutes = 9h 58m
    ChargesCard = screen.queryAllByTestId('ChargeCard');
    expect(ChargesCard).toHaveLength(3);




    // close the modal
    const closeModal = await screen.findByTestId('chargesViewModalCloseButton');
    await user.press(closeModal);

    await waitFor(() => {
        expect(screen.queryAllByTestId('chargesViewModalCloseButton')).toHaveLength(0);
    });


    // go back to home screen
    const goBack = screen.getByTestId('backButton');
    await user.press(goBack);

    // expect charges view to be gone
    await waitFor(() => {
        const ChargesView = screen.queryAllByTestId('ChargesView');
        expect(ChargesView).toHaveLength(0);
    });
});

test('should export file', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();

    render(<App />);
    await screen.findByTestId('ChargesCard');

    await user.press(screen.getByTestId('ChargesCard'));
    await screen.findByTestId('ChargesView');


    // now let's invert the order
    const openModal = screen.getByTestId('openModal');
    await user.press(openModal);

    const invertOrder = screen.getByTestId('exportButton');
    await user.press(invertOrder);

});