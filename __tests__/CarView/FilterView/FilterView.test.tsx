import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../../App";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import { render, waitFor, screen, userEvent, fireEventAsync } from "@testing-library/react-native";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import * as sharedPlatformsData from '../../../src/lib/storage/sharedPlatformsData';

jest.useFakeTimers();

jest.spyOn(sharedPlatformsData, 'getMileageHistory').mockImplementation(jest.fn());

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
            getChargesHistory: mockGetChargesHistory,
            getChargeSettings: jest.fn().mockResolvedValue({ hasError: true }),
            getHVACStatus: jest.fn().mockResolvedValue({ hasError: true }),
        }
    });
});


const mockJSONBatteryStatus = require('../mocks/mockRenaultBattery.json');
const mockJSONChargesHistory = require('../mocks/mockRenaultCharges.json');

test('should render the filter view with average power', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });

    await user.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });

    let chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const averagePowerText = queryAllByTestId('averagePowerText');
        expect(averagePowerText[0].props.children[0]).toBe('3.56'); // 32.25 * 60 / 543

        // check second charge
        expect(averagePowerText[1].props.children[0]).toBe('54.55'); // 50 * 60 / 55
        // check third charge
        expect(averagePowerText[2].props.children[0]).toBe('3.59'); // 23.20 * 60 / 388


    });

    //open filters modal 
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch average charging power filter
    await user.press(getByTestId('expandButtonaveragePower'));
    await waitFor(() => {
        expect(getByTestId('expandedaveragePower')).toBeDefined();
    });

    // fill left input to minimum 30kw
    let leftTextInput = getByTestId('leftTextInputaveragePower');
    await user.clear(leftTextInput);
    await user.type(leftTextInput, '30');

    // fill right input to maximum 120kw
    let rightTextInput = getByTestId('rightTextInputaveragePower');
    await user.clear(rightTextInput);
    await user.type(rightTextInput, '120');

    // edit left input to 40kw
    leftTextInput = getByTestId('leftTextInputaveragePower');
    await user.clear(leftTextInput);
    await user.type(leftTextInput, '40');

    // close the modal
    let confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // check the charges
    await waitFor(() => {
        const averagePowerText = queryAllByTestId('averagePowerText');
        expect(averagePowerText).toHaveLength(1);
        expect(averagePowerText[0].props.children[0]).toBe('54.55'); // 50 * 60 / 55

    });

    // open back filters modal
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // expand average charging power filter
    await user.press(getByTestId('expandButtonaveragePower'));
    await waitFor(() => {
        expect(getByTestId('expandedaveragePower')).toBeDefined();
    });

    // clear right value 
    rightTextInput = getByTestId('rightTextInputaveragePower');
    await user.clear(rightTextInput);


    // clear left value
    leftTextInput = getByTestId('leftTextInputaveragePower');
    await user.clear(leftTextInput);


    // close the modal
    confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // filter should have been deleted
    chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);
    await waitFor(() => {
        const averagePowerText = queryAllByTestId('averagePowerText');
        expect(averagePowerText).toHaveLength(3);
    });
}, 10000);

test('should render the filter view with added percentage', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });

    await user.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });


    let chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const averagePowerText = queryAllByTestId('batteryPercentageCharged');
        expect(averagePowerText[0].props.children[1]).toBe(56);

        // check second charge
        expect(averagePowerText[1].props.children[1]).toBe(6);
        // check third charge
        expect(averagePowerText[2].props.children[1]).toBe(42);

    });

    //open filters modal 
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch added percentage filter
    await user.press(getByTestId('expandButtonpercentageRecovered'));
    await waitFor(() => {
        expect(getByTestId('expandedpercentageRecovered')).toBeDefined();
    });

    // fill left input to minimum 45%
    let leftTextInput = getByTestId('leftTextInputpercentageRecovered');
    await user.clear(leftTextInput);
    await user.type(leftTextInput, '45');

    // fill right input to maximum 120%
    let rightTextInput = getByTestId('rightTextInputpercentageRecovered');
    await user.clear(rightTextInput);
    await user.type(rightTextInput, '120');

    // close the modal
    let confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // check the charges
    await waitFor(() => {
        const batteryPercentageCharged = queryAllByTestId('batteryPercentageCharged');
        expect(batteryPercentageCharged).toHaveLength(1);
        expect(batteryPercentageCharged[0].props.children[1]).toBe(56);
    });

    // open back modal
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // expand added percentage filter
    await user.press(getByTestId('expandButtonpercentageRecovered'));
    await waitFor(() => {
        expect(getByTestId('expandedpercentageRecovered')).toBeDefined();
    });

    // make sure left value is filled
    leftTextInput = getByTestId('leftTextInputpercentageRecovered');
    expect(leftTextInput.props.value).toBe('45');

    // make sure right value is filled
    rightTextInput = getByTestId('rightTextInputpercentageRecovered');
    expect(rightTextInput.props.value).toBe('120');


    // close modal
    confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // delete filter
    const filterListButton = getByTestId('filterListButton');
    await user.press(filterListButton);

    // check charges
    chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);
    await waitFor(() => {
        const batteryPercentageCharged = queryAllByTestId('batteryPercentageCharged');
        expect(batteryPercentageCharged).toHaveLength(3);
    });
}, 10000);



test('should render the filter view with added kwh', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });

    await fireEventAsync.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });

    const chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await fireEventAsync.press(chargeIndexArrow[1]);
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const kwhChargedText = queryAllByTestId('kwhChargedText');
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");

        // check second charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
        // check third charge
        expect(kwhChargedText[2].props.children[1]).toBe("23.20");
    });

    //open filters modal 
    await fireEventAsync.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch added kwh filter
    await fireEventAsync.press(getByTestId('expandButtonenergyRecovered'));
    await waitFor(() => {
        expect(getByTestId('expandedenergyRecovered')).toBeDefined();
    });

    // fill left input to minimum 40kwh
    const leftTextInput = getByTestId('leftTextInputenergyRecovered');
    await user.clear(leftTextInput);
    await user.type(leftTextInput, '40');

    // fill right input to maximum 70kwh
    const rightTextInput = getByTestId('rightTextInputenergyRecovered');
    await user.clear(rightTextInput);
    await user.type(rightTextInput, '70');

    // close the modal
    const confirmButton = getByTestId('confirmButton');
    await fireEventAsync.press(confirmButton);

    // check the charges
    await waitFor(() => {
        const kwhChargedText = queryAllByTestId('kwhChargedText');
        expect(kwhChargedText).toHaveLength(1);
        expect(kwhChargedText[0].props.children[1]).toBe("50.00");
    });
});

// TO FIX
/*
test('should render the filter view with date', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });

    await fireEventAsync.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });

    const chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await fireEventAsync.press(chargeIndexArrow[1]);
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const kwhChargedText = queryAllByTestId('kwhChargedText');
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");

        // check second charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
        // check third charge
        expect(kwhChargedText[2].props.children[1]).toBe("23.20");
    });

    //open filters modal 
    await fireEventAsync.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch date filter
    await fireEventAsync.press(getByTestId('expandButtondate'));
    await waitFor(() => {
        expect(getByTestId('expandeddate')).toBeDefined();
    });



    // fill the minimum input date to 2023-12-22T00:00:43Z
    const dateButtonStart = getByTestId('dateButtonstart_date');
    await fireEventAsync.press(dateButtonStart);
    await waitFor(() => {
        expect(getByTestId('dateTimePicker')).toBeDefined();
    });

    const minimumDate = new Date('2023-12-22T00:00:43Z');
    let dateTimePicker = getByTestId('dateTimePicker');
    expect(dateTimePicker).toBeDefined();
    await fireEventAsync(dateTimePicker, 'onConfirm', minimumDate);

    // close the modal
    let confirmButton = getByTestId('confirmButton');
    await fireEventAsync.press(confirmButton);

    // check the charges
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(2);
        // first charge should have been removed
        const kwhChargedText = queryAllByTestId('kwhChargedText');

        // check second charge
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");
        // check third charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
    });

    // open back filters modal
    //open filters modal 
    await fireEventAsync.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });




    // touch date filter
    await fireEventAsync.press(getByTestId('expandButtondate'));
    await waitFor(() => {
        expect(getByTestId('expandeddate')).toBeDefined();
    });

    // fill the minimum input date to 2023-12-23T00:00:43Z
    const dateButtonEnd = getByTestId('dateButtonend_date');

    await fireEventAsync.press(dateButtonEnd);
    await waitFor(() => {
        expect(getByTestId('dateTimePicker')).toBeDefined();
    });

    const maxDate = new Date('2023-12-23T00:00:43Z');
    dateTimePicker = getByTestId('dateTimePicker');
    expect(dateTimePicker).toBeDefined();
    await fireEventAsync(dateTimePicker, 'onConfirm', maxDate);

    // close the modal
    confirmButton = getByTestId('confirmButton');
    await fireEventAsync.press(confirmButton);

    // check the charges
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(1);
        // first charge and last charge should have been removed
        const kwhChargedText = getByTestId('kwhChargedText');

        expect(kwhChargedText.props.children[1]).toBe("50.00");
    });

});
*/


// TO FIX
/*
test('should render the filter view with date on android', async () => {
     jest.mock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'android', // or 'ios'
        select: () => null
    }));
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });

    const user = userEvent.setup();
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });


    await user.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });

    const chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await user.press(chargeIndexArrow[1]);
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const kwhChargedText = queryAllByTestId('kwhChargedText');
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");

        // check second charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
        // check third charge
        expect(kwhChargedText[2].props.children[1]).toBe("23.20");
    });

    //open filters modal 
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch date filter
    await user.press(getByTestId('expandButtondate'));
    await waitFor(() => {
        expect(getByTestId('expandeddate')).toBeDefined();
    });



    // fill the minimum input date to 2023-12-22T00:00:43Z
    const dateButtonStart = getByTestId('dateButtonstart_date');
    await user.press(dateButtonStart);
    await waitFor(() => {
        expect(getByTestId('dateTimePicker')).toBeDefined();
    });

    const minimumDate = new Date('2023-12-22T00:00:43Z');
    let dateTimePicker = getByTestId('dateTimePicker');
    expect(dateTimePicker).toBeDefined();
    await fireEventAsync(dateTimePicker, 'onConfirm', minimumDate);

    // close the modal
    let confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // check the charges
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(2);
        // first charge should have been removed
        const kwhChargedText = queryAllByTestId('kwhChargedText');

        // check second charge
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");
        // check third charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
    });

    // open back filters modal
    //open filters modal 
    await user.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });



    // touch date filter
    await user.press(getByTestId('expandButtondate'));
    await waitFor(() => {
        expect(getByTestId('expandeddate')).toBeDefined();
    });

    // fill the minimum input date to 2023-12-23T00:00:43Z
    const dateButtonEnd = getByTestId('dateButtonend_date');
    await user.press(dateButtonEnd);
    await waitFor(() => {
        expect(getByTestId('dateTimePicker')).toBeDefined();
    });

    const maxDate = new Date('2023-12-23T00:00:43Z');
    dateTimePicker = getByTestId('dateTimePicker');
    expect(dateTimePicker).toBeDefined();
    await fireEventAsync(dateTimePicker, 'onConfirm', maxDate);

    // close the modal
    confirmButton = getByTestId('confirmButton');
    await user.press(confirmButton);

    // check the charges
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(1);
        // first charge and last charge should have been removed
        const kwhChargedText = getByTestId('kwhChargedText');

        expect(kwhChargedText.props.children[1]).toBe("50.00");
    });
});
*/


test('should render the filter view with only DC filters', async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONBatteryStatus
    });
    mockGetChargesHistory.mockResolvedValueOnce({
        hasError: false,
        apiData: mockJSONChargesHistory
    });
    const { getByTestId, queryAllByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId('ChargesCard')).toBeDefined();
    });

    await fireEventAsync.press(getByTestId('ChargesCard'));
    await waitFor(() => {
        expect(getByTestId('ChargesView')).toBeDefined();
    });

    const chargeIndexArrow = queryAllByTestId('chargeIndexArrow');
    await fireEventAsync.press(chargeIndexArrow[1]);
    await waitFor(() => {
        // check indexes from new to old
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(3);
        // check first charge
        const kwhChargedText = queryAllByTestId('kwhChargedText');
        expect(kwhChargedText[0].props.children[1]).toBe("32.25");

        // check second charge
        expect(kwhChargedText[1].props.children[1]).toBe("50.00");
        // check third charge
        expect(kwhChargedText[2].props.children[1]).toBe("23.20");
    });

    //open filters modal 
    await fireEventAsync.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch DC filter
    await fireEventAsync.press(getByTestId('expandButtonshowOnlyDcCharges'));
    await waitFor(() => {
        expect(getByTestId('expandedshowOnlyDcCharges')).toBeDefined();
    });

    // touch DC switch
    let filterSwitch = getByTestId('filterSwitch');
    await fireEventAsync(filterSwitch, 'onValueChange', true);
    await waitFor(() => {
        expect(filterSwitch.props.value).toBe(true);
    });

    // close the modal
    let confirmButton = getByTestId('confirmButton');
    await fireEventAsync.press(confirmButton);

    // now check that only 1 charge is displayed
    await waitFor(() => {
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(1);
        // check first charge
        const kwhChargedText = getByTestId('kwhChargedText');
        expect(kwhChargedText.props.children[1]).toBe("50.00");
    });

    // now open back the modal
    await fireEventAsync.press(getByTestId('showFiltersButton'));
    await waitFor(() => {
        expect(getByTestId('filtersView')).toBeDefined();
    });

    // touch DC filter
    await fireEventAsync.press(getByTestId('expandButtonshowOnlyDcCharges'));
    await waitFor(() => {
        expect(getByTestId('expandedshowOnlyDcCharges')).toBeDefined();
    });

    // touch DC switch
    filterSwitch = getByTestId('filterSwitch');
    await fireEventAsync(filterSwitch, 'onValueChange', false);
    await waitFor(() => {
        expect(filterSwitch.props.value).toBe(false);
    });

    // close the modal
    confirmButton = getByTestId('confirmButton');
    await fireEventAsync.press(confirmButton);

    // now check that only 2 charges are displayed
    await waitFor(() => {
        const chargesCards = queryAllByTestId('ChargeCard');
        expect(chargesCards).toHaveLength(2);
    });


});