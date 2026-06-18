import AsyncStorage from "@react-native-async-storage/async-storage";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import { render, waitFor, userEvent, screen } from "@testing-library/react-native";

jest.useFakeTimers();

beforeEach(async () => {
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
    await AsyncStorage.setItem('appPreferences', JSON.stringify({ mergeCharges: true }));
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

import mockJSONBatteryStatus from '../mocks/mockRenaultBattery.json';
import mockJSONChargesHistory from '../mocks/mockRenaultChargesMerge.json';
import App from "../../../App";

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

    await screen.findByTestId('ChargesCard')

    await user.press(await screen.findByTestId('ChargesCard'));

    await screen.findByTestId('ChargesView');


    // check the charges
    // check indexes from new to old
    let chargesCards = await screen.findAllByTestId('ChargeCard');
    expect(chargesCards).toHaveLength(1);

    const kwhChargedText = await screen.findByTestId('kwhChargedText');
    expect(kwhChargedText.props.children[1]).toBe("105.45");

    const chargeLengthText = await screen.findByTestId('chargeLengthText');
    expect(chargeLengthText.props.children[0]).toBe("1");
    expect(chargeLengthText.props.children[1]).toBe("6");
    expect(chargeLengthText.props.children[2]).toBe("h");
    expect(chargeLengthText.props.children[3]).toBe("2"); // 388 + 55 + 543 minutes = 986 minutes = 16h 26m
    expect(chargeLengthText.props.children[4]).toBe("6");

    const averagePowerText = await screen.findByTestId('averagePowerText');
    expect(averagePowerText.props.children[0]).toBe("6.42"); // 105.45 kWh / 16.43 hours = 6.42 kW

    const mergeChargeCount = await screen.findByTestId('mergeChargeCount');
    expect(mergeChargeCount.props.children).toBe(3);



    // press to open the charge details
    const mergeChargeDetailsButton = await screen.findByTestId('mergeChargeDetailsButton');
    await user.press(mergeChargeDetailsButton);

    chargesCards = await screen.findAllByTestId('ChargeCard');
    expect(chargesCards).toHaveLength(4); // merge charge + 3 subcharges

    const kwgChargedText = await screen.findAllByTestId('kwhChargedText');
    expect(kwgChargedText[0].props.children[1]).toBe("23.20");
    expect(kwgChargedText[1].props.children[1]).toBe("50.00");
    expect(kwgChargedText[2].props.children[1]).toBe("32.25");

    // now close the modal
    const MergeChargeModalCloseButton = await screen.findByTestId('mergeViewBottomSheetCloseButton');
    await user.press(MergeChargeModalCloseButton);

    chargesCards = await screen.findAllByTestId('ChargeCard');
    expect(chargesCards).toHaveLength(1); // back to the merge charge
});