jest.unmock('../../src/lib/clients/kelec-api/kelecApiHandler');
import AsyncStorage from "@react-native-async-storage/async-storage";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import App from "../../App";
import { render, waitFor, screen, userEvent, fireEvent } from "@testing-library/react-native";
import CarType, { CarTypeInterface } from "../../src/lib/clients/cars/carTypes/carType";
import StorageHandler from "../../src/lib/storage/storageHandler";
import { Linking } from "react-native";

beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

const mockApiData = require('./mocks/mockHyundaiApiData.json');
const mockGetCarStatus = jest.fn();
jest.mock('../../src/lib/clients/carMakers/hyundaiClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getCarStatus: mockGetCarStatus
        }
    });
});

const mockBrands = jest.fn().mockResolvedValue([
    {
        "display_name": "RenaultBrandToAdd",
        "name": "renault",
    }
]);
const mockModels = jest.fn().mockResolvedValue([
    {
        "display_name": "ZOEModelToAdd",
        "name": "megane_e_tech",
        "engine_type": "ELEC",
    }
]);
const mockBatteries = jest.fn().mockResolvedValue(
    [
        {
            "size": 60,
            "max_ac_power": 7.4,
            "max_dc_power": 130
        },
        {
            "size": 60,
            "max_ac_power": 22,
            "max_dc_power": -1 // -1 means that the car does not support DC charging
        }
    ]
);

jest.mock('../../src/lib/clients/kelec-api/kelecApiHandler', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBrands: jest.fn().mockResolvedValue(mockBrands()),
            getModels: jest.fn().mockResolvedValue(mockModels()),
            getBatteries: jest.fn().mockResolvedValue(mockBatteries()),
            getMessage: jest.fn().mockResolvedValue(null)
        }
    });
});


test('should open the car model choice screen without filled values', async () => {
    const storageHandler = new StorageHandler();
    const data = await storageHandler.getCarType("vin1");
    expect(data).toBeNull();

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });


    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();

    });

    await waitFor(async () => {
        // the modelDropdown should not be truthy
        expect(() => screen.getByTestId('modelDropdown')).toThrow();
        // the brandDropDown should be truthy
        expect(screen.getByTestId('brandDropdown')).toBeDefined();
    });
});

test('should open the car model choice screen with filled values', async () => {
    const carTypeInterface: CarTypeInterface = {
        brand: {
            "display_name": "RenaultBrandToAdd",
            "name": "renault",
        },
        model: {
            "display_name": "ZOEModelToAdd",
            "name": "megane_e_tech",
            "engine_type": "ELEC",
        },
        battery: {
            "size": 60,
            "max_ac_power": 7.4,
            "max_dc_power": 130
        },
        chargingLimit: 80
    }
    const carType = new CarType(carTypeInterface);
    const storageHandler = new StorageHandler();
    await storageHandler.setCarType("vin1", carType);

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });


    let openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();

    });

    await waitFor(async () => {
        // the brandDropDown should be truthy
        expect(screen.getByTestId('brandDropdown')).toBeDefined();
        expect(screen.getByTestId('brandDropdown-label').props.children).toBe('RenaultBrandToAdd');

        // the modelDropdown should be truthy
        expect(screen.getByTestId('modelDropdown')).toBeDefined();
        expect(screen.getByTestId('modelDropdown-label').props.children).toBe('ZOEModelToAdd');

        // the batteryDropdown should be truthy
        expect(screen.getByTestId('batteryDropdown')).toBeDefined();
        expect(screen.getByTestId('batteryDropdown-label').props.children).toBe('60 kWh / AC 7.4 kW / DC 130 kW');

        expect(screen.getByTestId('chargingLimitText').props.children[0]).toBe(80);
    });

    // now decide to change the car model 
    const batteryDropdownFocus = screen.getByTestId('batteryDropdown');
    await user.press(batteryDropdownFocus);
    await waitFor(() => {
        expect(screen.getByText('60 kWh / AC 22 kW')).toBeDefined();
    });

    // click on it

    const batteryDropdown = screen.getByText('60 kWh / AC 22 kW');
    await user.press(batteryDropdown);
    await waitFor(() => {
        expect(screen.getByTestId('batteryDropdown-label').props.children).toBe('60 kWh / AC 22 kW');
    });

    // confirm

    let confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(async () => {
        expect(() => screen.getByTestId('carModelChoiceStep')).toThrow();
    });

    const data = await storageHandler.getCarType("vin1");
    expect(data).not.toBeNull();
    expect(data?.getBattery().size).toBe(60);
    expect(data?.getBattery().max_ac_power).toBe(22);
    expect(data?.getBattery().max_dc_power).toBe(-1);
    expect(data?.getChargingLimit()).toBe(80);


    // now go back and raise the charging limit

    openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });

    jest.mock('react-native', () => {
        const RN = jest.requireActual('react-native');
        RN.PanResponder = {
            create: (handlers: any) => ({
                panHandlers: handlers
            })
        };
        return RN;
    });

    const chargingLimitSlider = screen.getByTestId('chargingLimitSlider');
    expect(screen.getByTestId('chargingLimitText').props.children[0]).toBe(80);
    /* test with pan responder */
    fireEvent(chargingLimitSlider, 'layout', {
        nativeEvent: {
            layout: { width: 300, height: 50, x: 0, y: 0 },
        },
        target: {
            measure: (callback: (fx: number, fy: number, w: number, h: number, px: number, py: number) => void) => {
                callback(0, 0, 300, 50, 10, 20); // largeur fixe 300px
            },
        },
    });

    fireEvent(chargingLimitSlider, "responderGrant", {
        nativeEvent: {
            touches: [{ pageX: 0, pageY: 0 }], // Initial touch position
            changedTouches: [],
            target: chargingLimitSlider,
            identifier: 1,
        },
        touchHistory: { mostRecentTimeStamp: "2", touchBank: [] },
    });

    fireEvent(chargingLimitSlider, "responderMove", {
        touchHistory: {
            mostRecentTimeStamp: "1",
            touchBank: [
                {
                    touchActive: true,
                    currentTimeStamp: 1,
                    currentPageX: 260, // 85% * 300 = 255
                    previousPageX: 0,
                },
            ],
            numberActiveTouches: 1,
            indexOfSingleActiveTouch: 0, // for touchBank[0]
        },
    });



    expect(screen.getByTestId('chargingLimitText').props.children[0]).toBe(85);

    // confirm

    confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(async () => {
        expect(() => screen.getByTestId('carModelChoiceStep')).toThrow();
    });

    const data2 = await storageHandler.getCarType("vin1");
    expect(data2).not.toBeNull();
    expect(data2?.getChargingLimit()).toBe(85);
});

test('charging limit slider should not be displayed with hyundai cars', async () => {
    const carTypeInterface: CarTypeInterface = {
        brand: {
            "display_name": "HyundaiBrandToAdd",
            "name": "hyundai",
        },
        model: {
            "display_name": "ZOEModelToAdd",
            "name": "ZOE",
            "engine_type": "ELEC",
        },
        battery: {
            "size": 60,
            "max_ac_power": 7.4,
            "max_dc_power": 130
        },
        chargingLimit: 80
    }
    const carType = new CarType(carTypeInterface);
    const storageHandler = new StorageHandler();
    await storageHandler.setCarType("vin1", carType);

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });


    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });

    await waitFor(async () => {
        expect(() => screen.getByTestId('chargingLimitButtonPlus')).toThrow();
    });

});

test('should open the menu and go back', async () => {

    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId('summaryCard');

    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await screen.findByTestId('carModelChoiceStep');



    const backButton = await screen.findByTestId('previousButton');
    await user.press(backButton);
    await waitFor(() => {
        expect(() => screen.getByTestId('carModelChoiceStep')).toThrow();
    });
});

test('should open mail when car is not listed', async () => {
    jest.spyOn(Linking, 'openURL').mockReturnValueOnce(Promise.resolve());

    const user = userEvent.setup();
    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });


    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });


    const carNotListedButton = screen.getByTestId('carNotListedButton');
    await user.press(carNotListedButton);
    await waitFor(async () => {
        expect(Linking.openURL).toHaveBeenCalledWith('mailto:contact@kelec.app?subject=Kelec new model&body=I have the following 100% electric cars that is not listed in Kelec: ');
    });
});

test('should display errors when confirming without filling the values', async () => {
    const storageHandler = new StorageHandler();
    const data = await storageHandler.getCarType("vin1");
    expect(data).toBeNull();
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    const user = userEvent.setup();
    render(<App />);


    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
    });


    const openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });

    // try to confirm
    let confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(async () => {
        expect(screen.getByTestId('carBrandText')).toHaveStyle({ color: 'red' });
    });

    // now fill the brand
    const brandDropdownFocus = screen.getByTestId('brandDropdown');
    await user.press(brandDropdownFocus);
    await waitFor(() => {
        expect(screen.getByText('RenaultBrandToAdd')).toBeDefined();
    });

    // click on it
    const brandDropdown = screen.getByText('RenaultBrandToAdd');
    await user.press(brandDropdown);
    await waitFor(() => {
        expect(screen.getByTestId('brandDropdown-label').props.children).toBe('RenaultBrandToAdd');
    });

    // try to confirm 

    confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(async () => {
        expect(screen.getByTestId('carModelText')).toHaveStyle({ color: 'red' });
    });

    // now fill the model   
    const modelDropdownFocus = screen.getByTestId('modelDropdown');
    await user.press(modelDropdownFocus);
    await waitFor(() => {
        expect(screen.getByText('ZOEModelToAdd')).toBeDefined();
    });

    // click on it
    const modelDropdown = screen.getByText('ZOEModelToAdd');
    await user.press(modelDropdown);
    await waitFor(() => {
        expect(screen.getByTestId('modelDropdown-label').props.children).toBe('ZOEModelToAdd');
    });

    // try to confirm

    confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(async () => {
        expect(screen.getByTestId('batteryText')).toHaveStyle({ color: 'red' });
    });
}); 