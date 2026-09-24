import { buildUserAccount } from "../../src/packages/kelec-garage";
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import AsyncStorage from "@react-native-async-storage/async-storage";
import CarModel from "../../src/lib/clients/cars/carModel";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import App from "../../App";


jest.useFakeTimers();

const mockSaveNativeAccount = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    const car1: CarModel = new CarModel('vin1', 'model1', 'url.com', CarMaker.RENAULT, 'AA001AA');
    await AsyncStorage.setItem('vin1/image', 'image1');
    const account1: Account = new Account('email', 'password', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account1]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});


jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getVehicles: jest.fn().mockResolvedValue({
                vehicles: []
            }),
            getBatteryStatus: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getCockpit: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getLocation: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            })
        }
    });
});

test('should rename the car', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;
    expect(accountParsed?.getCars().length).toBe(1);

    const userSetup = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await userSetup.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(1);
        expect(profileCarRowModel[0].props.children).toBe('model1');

    });


    // now click rename modal to open 

    const renameButton = screen.queryAllByTestId("renameCarOpenButton");
    await userSetup.press(renameButton[0]);

    await waitFor(() => {
        // check the input has current name value
        const renameCarInput = screen.getByTestId('carNameInput');
        expect(renameCarInput.props.value).toBe('model1');
    });

    // now change the name and click confirm

    const renameCarInput = screen.getByTestId('carNameInput');
    await userSetup.clear(renameCarInput);
    await userSetup.type(renameCarInput, 'newModel');
    await waitFor(() => {
        expect(renameCarInput.props.value).toBe('newModel');
    });

    const confirmButton = screen.getByTestId('carNameModalConfirm');
    await userSetup.press(confirmButton);
    await waitFor(() => {
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel[0].props.children).toBe('newModel');
    });
});

test('should not rename the car because cancel', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;
    expect(accountParsed?.getCars().length).toBe(1);

    const userSetup = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await userSetup.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(1);
        expect(profileCarRowModel[0].props.children).toBe('model1');

    });

    // now click rename modal to open 
    const renameButton = screen.queryAllByTestId("renameCarOpenButton");
    await userSetup.press(renameButton[0]);

    await waitFor(() => {
        // check the input has current name value
        const renameCarInput = screen.getByTestId('carNameInput');
        expect(renameCarInput.props.value).toBe('model1');
    });

    // now change the name and click confirm

    const renameCarInput = screen.getByTestId('carNameInput');
    await userSetup.clear(renameCarInput);
    await userSetup.type(renameCarInput, 'newModel');
    await waitFor(() => {
        expect(renameCarInput.props.value).toBe('newModel');
    });

    const confirmButton = screen.getByTestId('carNameModalCancel');
    await userSetup.press(confirmButton);
    await waitFor(() => {
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        // should be the original name
        expect(profileCarRowModel[0].props.children).toBe('model1');
    });
}); 