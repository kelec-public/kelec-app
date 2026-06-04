jest.unmock('../../../src/lib/clients/kelec-api/kelecApiHandler');
import AsyncStorage from "@react-native-async-storage/async-storage";
import HyundaiCar from "../../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import CarType, { CarTypeInterface } from "../../../src/lib/clients/cars/carTypes/carType";
import StorageHandler from "../../../src/lib/storage/storageHandler";
import App from "../../../App";
import { render, waitFor, screen, userEvent, fireEventAsync } from "@testing-library/react-native";

afterAll(() => {
    jest.useRealTimers();
});


beforeEach(async () => {
    jest.useFakeTimers()
        .setSystemTime(new Date("2025-07-01T00:00:00Z")); // Set a fixed date for consistent testing
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");

});

const mockApiData = require('../mocks/mockHyundaiApiData.json');
const mockGetCarStatus = jest.fn();
jest.mock('../../../src/lib/clients/carMakers/hyundaiClient', () => {
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

jest.mock('../../../src/lib/clients/kelec-api/kelecApiHandler', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBrands: jest.fn().mockResolvedValue(mockBrands()),
            getModels: jest.fn().mockResolvedValue(mockModels()),
            getBatteries: jest.fn().mockResolvedValue(mockBatteries()),
            getMessage: jest.fn().mockResolvedValue(null)
        }
    });
});

// TO FIX
/*
test('should insert leasing data', async () => {
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

    // now press the leasing switch
    const leasingSwitch = screen.getByTestId('leasingSwitch');
    await fireEventAsync(leasingSwitch, 'onPress');
    await waitFor(() => {
        expect(screen.getByTestId('leasingStartDate')).toBeDefined();
    });

    // now try to submit
    const confirmCarModelChoice = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice);
    await waitFor(() => {
        expect(screen.getByTestId('leasingStartDate')).toHaveStyle({ color: 'red' });
        expect(screen.getByTestId('leasingEndDate')).toHaveStyle({ color: 'red' });
        expect(screen.getByTestId('totalMileageAllowed')).toHaveStyle({ color: 'red' });
    });

    // now set start date
    const startDatePicker = screen.getByTestId('dateButtonstart_date');
    await user.press(startDatePicker);
    await waitFor(() => {
        expect(screen.getByTestId('dateTimePicker')).toBeDefined();
    });

    const startDate = new Date("2025-01-01T00:00:00Z");
    let datePicker = screen.getByTestId('dateTimePicker');
    await fireEventAsync(datePicker, 'onConfirm', startDate);


    await waitFor(() => {
        expect(screen.getByTestId('leasingStartDate')).toHaveStyle({ color: 'black' });
    });

    // now set end date
    const endDatePicker = screen.getByTestId('dateButtonend_date');
    await user.press(endDatePicker);
    await waitFor(() => {
        expect(screen.getByTestId('dateTimePicker')).toBeDefined();
    });

    const endDate = new Date("2026-01-01T00:00:00Z");
    datePicker = screen.getByTestId('dateTimePicker');
    await fireEventAsync(datePicker, 'onConfirm', endDate);
    await waitFor(() => {
        expect(screen.getByTestId('leasingEndDate')).toHaveStyle({ color: 'black' });
    });

    // now set total mileage
    const totalMileageInput = screen.getByTestId('totalMileageAllowedInput');
    await user.clear(totalMileageInput);
    await user.type(totalMileageInput, '100000');
    await waitFor(() => {
        expect(screen.getByTestId('totalMileageAllowed')).toHaveStyle({ color: 'black' });
    });

    // now try again to submit
    await user.press(confirmCarModelChoice);
    await waitFor(() => {
        // check the mileage number
        expect(screen.getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('1 130'); // the car has 100 000km allowed. It is exactly the end of the 1 year contract and the car has 48459km, meaning it is (49598 - 48459km = 1139km) 1139km under the limit (50 000 - 48459 = 1541)
        expect(screen.getByTestId('summaryCardLeasingMileageUnder')).toBeDefined();
    });

    const carTypeFromStorage = await storageHandler.getCarType("vin1");
    expect(carTypeFromStorage!.getLeasingData()).toBeDefined();
    expect(carTypeFromStorage!.getLeasingData()?.startDate).toBe(startDate.toISOString());
    expect(carTypeFromStorage!.getLeasingData()?.endDate).toBe(endDate.toISOString());
    expect(carTypeFromStorage!.getLeasingData()?.totalMileage).toBe(100000);

    // now go back to change the start mileage
    openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });


    await waitFor(async () => {
        // the brandDropDown should be truthy
        expect(screen.getByTestId('brandDropdown')).toBeDefined();
        expect(screen.getByTestId('brandDropdown-label').props.children).toBe('RenaultBrandToAdd');
    });


    const mileageAtStartInput = screen.getByTestId('mileageAtStartInput');
    await user.type(mileageAtStartInput, '5000');
    await waitFor(() => {
        expect(screen.getByTestId('mileageAtStart')).toHaveStyle({ color: 'black' });
    });

    // touch confirm button
    const confirmCarModelChoice2 = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice2);
    await waitFor(() => {
        // check the mileage number
        // the car has 100 000km allowed and was delivered with 5 000km. 
        // It means a daily allowance of (100 000km - 5 000km) / 365 = 260.27km per day.
        // After 6 months, the allowance should be 260.27km * 180 days = 47 109 +  5000 = 52 109km
        // The car has 48 459km, meaning the the car is (52 109 - 48 459km = 3 650km) 3 651km with rounding under the limit
        expect(screen.getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('3 651'); // the car has 100 000km allowed and was delivered with 5 000km. It is exactly the end of the 1 year contract and the car has 48459km, meaning it is (49598 - 48459km + 5000 = 6139km) 6139km under the limit (50 000 - 48459 = 1541)
        expect(screen.getByTestId('summaryCardLeasingMileageUnder')).toBeDefined();
    });

    // now go back to change the start mileage
    openModalButton = screen.getByTestId('openModalButton'); // open the car model choice screen
    await user.press(openModalButton);
    await waitFor(() => {
        expect(screen.getByTestId('carModelChoiceStep')).toBeDefined();
    });


    // now to back to remove the start mileage
    await waitFor(async () => {
        // the brandDropDown should be truthy
        expect(screen.getByTestId('brandDropdown')).toBeDefined();
        expect(screen.getByTestId('brandDropdown-label').props.children).toBe('RenaultBrandToAdd');
    });

    const mileageAtStartInput2 = screen.getByTestId('mileageAtStartInput');
    await user.clear(mileageAtStartInput2);
    await waitFor(() => {
        expect(screen.getByTestId('mileageAtStart')).toHaveStyle({ color: 'black' });
    });

    // touch confirm button
    const confirmCarModelChoice3 = screen.getByTestId('confirmCarModelChoice');
    await user.press(confirmCarModelChoice3);
    await waitFor(() => {
        // check the mileage number
        expect(screen.getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('1 130'); // the car has 100 000km allowed and was delivered with 5 000km. It is exactly the end of the 1 year contract and the car has 48459km, meaning it is (49598 - 48459km + 5000 = 6139km) 6139km under the limit (50 000 - 48459 = 1541)
        expect(screen.getByTestId('summaryCardLeasingMileageUnder')).toBeDefined();
    });
});
*/

test('should be over the leasing mileage', async () => {
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
        chargingLimit: 80,
        leasing: {
            startDate: new Date("2025-01-01T00:00:00Z"),
            endDate: new Date("2026-01-01T00:00:00Z"),
            totalMileage: 30000
        }
    }
    const carType = new CarType(carTypeInterface);
    const storageHandler = new StorageHandler();
    await storageHandler.setCarType("vin1", carType);

    render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(screen.getByTestId('summaryCard')).toBeDefined();
        expect(screen.getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('33 582'); // 33 583 over the limit
        expect(screen.getByTestId('summaryCardLeasingMileageOver')).toBeDefined();
    });
});

test('should be over with end of leasing in the past', async () => {
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
        chargingLimit: 80,
        leasing: {
            startDate: new Date("2024-01-01T00:00:00Z"),
            endDate: new Date("2025-01-01T00:00:00Z"),
            totalMileage: 30000
        }
    }
    const carType = new CarType(carTypeInterface);
    const storageHandler = new StorageHandler();
    await storageHandler.setCarType("vin1", carType);

    const { getByTestId, getByText } = render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(getByTestId('summaryCard')).toBeDefined();
        expect(getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('18 459'); // (car has 48459km, meaning it is (48459 - 30000km = 18459km) 18459km over the limit)
        expect(getByTestId('summaryCardLeasingMileageOver')).toBeDefined();
    });
});


test('should be under with start of leasing in the future', async () => {
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
        chargingLimit: 80,
        leasing: {
            startDate: new Date("2026-01-01T00:00:00Z"),
            endDate: new Date("2027-01-01T00:00:00Z"),
            totalMileage: 30000
        }
    }
    const carType = new CarType(carTypeInterface);
    const storageHandler = new StorageHandler();
    await storageHandler.setCarType("vin1", carType);

    const { getByTestId } = render(<App />);
    mockGetCarStatus.mockResolvedValueOnce({
        hasError: false,
        apiData: mockApiData
    });

    await waitFor(async () => {
        expect(getByTestId('summaryCard')).toBeDefined();
        expect(getByTestId('summaryCardLeasingMileage').props.children[0]).toBe('48 459'); // (car has 48459km, meaning it is (48459 - 30000km = 18459km) 18459km over the limit)
        expect(getByTestId('summaryCardLeasingMileageOver')).toBeDefined();
    });
}); 