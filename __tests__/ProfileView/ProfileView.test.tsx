import AsyncStorage from "@react-native-async-storage/async-storage";
import CarModel from "../../src/lib/clients/cars/carModel";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import App from "../../App";
import { render, waitFor, screen, userEvent, act } from "@testing-library/react-native";
import { buildUserAccount } from "../../src/packages/kelec-garage";
import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { getBlackColour, getWhiteColour } from "../../src/lib/graphics/utils";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
import { Alert, AlertButton } from "react-native";

type AlertSpyProps = jest.SpyInstance<
    void,
    [
        title: string,
        message: string,
        buttons: [
            {
                text: string
                style: AlertButton['style']
                onPress: (value?: string) => void
            },
            {
                text: string
                style: AlertButton['style']
                onPress: (value?: string) => void
            },
        ],
    ]
>
const AlertSpy = jest.spyOn(Alert, 'alert') as AlertSpyProps



jest.useFakeTimers();

const mockSaveNativeAccount = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);

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

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    const car1: CarModel = new CarModel('vin1', 'model1', 'url.com', CarMaker.RENAULT, 'AA001AA');
    const car2: CarModel = new CarModel('vin2', 'model2', 'url.com', CarMaker.HYUNDAI, 'BB001BB');
    await AsyncStorage.setItem('vin1/image', 'image1');
    const car3: CarModel = new CarModel('vin3', 'model3', 'url.com', CarMaker.DACIA);
    const account1: Account = new Account('email', '', CarMaker.RENAULT, car1);
    const account2: Account = new Account('email', '', CarMaker.RENAULT, car2);
    const account3: Account = new Account('email', '', CarMaker.RENAULT, car3);
    const userAccount: UserAccount = new UserAccount('vin1', [account1, account2, account3]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});


test('should render the profile view', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;
    expect(accountParsed?.getCars().length).toBe(3);
    expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
    expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');
    expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

    // we should have 3 cars in order

    const UserEvent = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await UserEvent.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(3);
        expect(profileCarRowModel[0].props.children).toBe('model1');
        expect(profileCarRowModel[1].props.children).toBe('model2');
        expect(profileCarRowModel[2].props.children).toBe('model3');

        const vinOrRegistrationCarRow = screen.queryAllByTestId('vinOrRegistrationCarRow');
        expect(vinOrRegistrationCarRow.length).toBe(3);
        expect(vinOrRegistrationCarRow[0].props.children).toBe('AA-001-AA');
        expect(vinOrRegistrationCarRow[1].props.children).toBe('BB-001-BB');
        expect(vinOrRegistrationCarRow[2].props.children).toBe('vin3');

    });
});

test('should move the car up', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;

    expect(accountParsed?.getCars().length).toBe(3);
    expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
    expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');
    expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

    // we should have 3 cars in order

    const UserEvent = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    // open the profile tab
    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await UserEvent.press(bottomButtonperson[0]);
    await waitFor(async () => {
        expect(screen.getByTestId('profileView')).toBeDefined();
    });

    // enable edit mode

    let profileViewEditCarsButton = screen.getByTestId('profileViewEditCarsButton');
    await UserEvent.press(profileViewEditCarsButton);

    await waitFor(async () => {
        // verify only 2 buttons are available 
        const moveTheCarUp = screen.queryAllByTestId('moveTheCarUp');
        expect(moveTheCarUp.length).toBe(2);
    });

    // move the first car up
    const moveTheCarUp = screen.queryAllByTestId('moveTheCarUp');
    await UserEvent.press(moveTheCarUp[0]);
    await waitFor(async () => {
        // verify the widgets have been updated (useless in this case)
        expect(mockSaveNativeAccount).toHaveBeenCalled();
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the order of cars have been changed
        expect(accountParsed?.getCars().length).toBe(3);
        expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin2');
        expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin1');
        expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

        // and that the view has been rerendered
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(3);
        expect(profileCarRowModel[0].props.children).toBe('model2');
        expect(profileCarRowModel[1].props.children).toBe('model1');
        expect(profileCarRowModel[2].props.children).toBe('model3');
    });

    // exit edit mode
    profileViewEditCarsButton = screen.getByTestId('profileViewEditCarsButton');
    await UserEvent.press(profileViewEditCarsButton);
});

test('should move the car down', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;

    expect(accountParsed?.getCars().length).toBe(3);
    expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
    expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');
    expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

    // we should have 3 cars in order

    const UserEvent = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    // open the profile tab
    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await UserEvent.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
    });

    // enable edit mode

    // check the edit icon is white first
    const editIcon = screen.getByTestId('profileViewEditIcon');
    expect(editIcon.props.style[0].color).toBe(getBlackColour(false));
    let profileViewEditCarsButton = screen.getByTestId('profileViewEditCarsButton');
    await UserEvent.press(profileViewEditCarsButton);
    await waitFor(async () => {
        // check the edit icon is black
        const editIcon = screen.getByTestId('profileViewEditIcon');
        expect(editIcon.props.style[0].color).toBe(getWhiteColour(false));

    });
    await waitFor(async () => {
        // verify only 2 buttons are available 
        const moveTheCarDown = screen.queryAllByTestId('moveTheCarDown');
        expect(moveTheCarDown.length).toBe(2);
    });

    // move the first car down
    const moveTheCarDown = screen.queryAllByTestId('moveTheCarDown');
    await UserEvent.press(moveTheCarDown[0]);
    await waitFor(async () => {
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the order of cars have been changed
        expect(accountParsed?.getCars().length).toBe(3);
        expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin2');
        expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin1');
        expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

        // and that the view has been rerendered
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(3);
        expect(profileCarRowModel[0].props.children).toBe('model2');
        expect(profileCarRowModel[1].props.children).toBe('model1');
        expect(profileCarRowModel[2].props.children).toBe('model3');
    });
    // exit edit mode

    profileViewEditCarsButton = screen.getByTestId('profileViewEditCarsButton');
    await UserEvent.press(profileViewEditCarsButton);
    await waitFor(async () => {
        // check the edit icon is black again
        const editIcon = screen.getByTestId('profileViewEditIcon');
        expect(editIcon.props.style[0].color).toBe(getBlackColour(false));

    });
});

test('should delete cars', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;

    expect(accountParsed?.getCars().length).toBe(3);
    expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
    expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');
    expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');

    // we should have 3 cars in order

    const UserEvent = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    // open the profile tab
    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await UserEvent.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
    });
    await waitFor(async () => {
        // verify the 3 buttons are available 
        const deleteTheCar = screen.queryAllByTestId('deleteTheCar');
        expect(deleteTheCar.length).toBe(3);
    });

    let deleteTheCar = screen.queryAllByTestId('deleteTheCar');
    // delete the last car
    await UserEvent.press(deleteTheCar[2]);
    let confirmCallback = AlertSpy.mock.calls[0][2][1].onPress;
    await act(async () => confirmCallback());

    await waitFor(async () => {
        // verify the widgets have been updated (useless in this case)
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the order of cars have been changed
        expect(accountParsed?.getCars().length).toBe(2);
        expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
        expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');

        // and that the view has been rerendered
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(2);
        expect(profileCarRowModel[0].props.children).toBe('model1');
        expect(profileCarRowModel[1].props.children).toBe('model2');

    });


    deleteTheCar = screen.queryAllByTestId('deleteTheCar');
    // delete the first car which is the default car to update the selected car
    await UserEvent.press(deleteTheCar[0]);
    confirmCallback = AlertSpy.mock.calls[1][2][1].onPress;
    await act(async () => confirmCallback());

    await waitFor(async () => {
        // verify the widgets have been updated (useless in this case)
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the order of cars have been changed
        expect(accountParsed?.getCars().length).toBe(1);
        expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin2');
        expect(accountParsed?.getSelectedCar()).toBe('vin2');

        // and that the view has been rerendered
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(1);
        expect(profileCarRowModel[0].props.children).toBe('model2');
    });

    deleteTheCar = screen.queryAllByTestId('deleteTheCar');
    // delete the last car and clear the selected car
    await UserEvent.press(deleteTheCar[0]);

    // the deleting is cancelled
    confirmCallback = AlertSpy.mock.calls[2][2][0].onPress;
    await act(async () => confirmCallback());
    // verify no changes
    // now try to delete the car
    await UserEvent.press(deleteTheCar[0]);
    const confirmCallback2 = AlertSpy.mock.calls[2][2][1].onPress;
    await act(async () => confirmCallback2());
    await waitFor(async () => {

    });
    await waitFor(async () => {
        // verify the widgets have been updated (useless in this case)
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the order of cars have been changed
        expect(accountParsed?.getCars().length).toBe(0);
        expect(accountParsed?.getSelectedCar()).toBe('');

        // and that the view has been rerendered
        const profileCarRowModel = screen.queryAllByTestId('profileCarRowModel');
        expect(profileCarRowModel.length).toBe(0);

        // the edit mode button should not be displayed
        const profileViewEditCarsButton = screen.queryAllByTestId('profileViewEditCarsButton');
        expect(profileViewEditCarsButton.length).toBe(0);
    });
});

test('should set selected car', async () => {
    const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
    const accountParsed = (await buildUserAccount(user, async () => null)).user;

    expect(accountParsed?.getCars().length).toBe(3);
    expect(accountParsed?.getCars()[0].car?.getVin()).toBe('vin1');
    expect(accountParsed?.getCars()[1].car?.getVin()).toBe('vin2');
    expect(accountParsed?.getCars()[2].car?.getVin()).toBe('vin3');
    expect(accountParsed?.getSelectedCar()).toBe('vin1');

    // we should have 3 cars in order

    const UserEvent = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });
    // open the profile tab
    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await UserEvent.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
    });

    await waitFor(async () => {
        // verify the 3 buttons are available 
        const selectAsDefaultCar = screen.queryAllByTestId('selectAsDefaultCar');
        expect(selectAsDefaultCar.length).toBe(3);
        // check the only the first one is highlighted
        const selectAsDefaultCarIcon = screen.queryAllByTestId('selectAsDefaultCarIcon');
        expect(selectAsDefaultCarIcon.length).toBe(3);
        expect(selectAsDefaultCarIcon[0].props.style[2].backgroundColor).toBe('black');
        expect(selectAsDefaultCarIcon[1].props.style[2].backgroundColor).toBe('white');
        expect(selectAsDefaultCarIcon[2].props.style[2].backgroundColor).toBe('white'); // card style
    });

    const selectAsDefaultCar = screen.queryAllByTestId('selectAsDefaultCar');
    // select the second car
    await UserEvent.press(selectAsDefaultCar[1]);
    await waitFor(async () => {
        // verify the widgets have been updated (useful in this case)
        const user = JSON.parse(await AsyncStorage.getItem('account') ?? "");
        const accountParsed = (await buildUserAccount(user, async () => null)).user;

        // verify the selected car has been changed
        expect(accountParsed?.getSelectedCar()).toBe('vin2');

        // and that the view has been rerendered
        const selectAsDefaultCarIcon = screen.queryAllByTestId('selectAsDefaultCarIcon');
        expect(selectAsDefaultCarIcon.length).toBe(3);
        expect(selectAsDefaultCarIcon[0].props.style[2].backgroundColor).toBe("white");
        expect(selectAsDefaultCarIcon[1].props.style[2].backgroundColor).toBe('black');
        expect(selectAsDefaultCarIcon[2].props.style[2].backgroundColor).toBe("white");
    });
});


test('should add a car', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(async () => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });
    // open the profile tab
    const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => {
        expect(screen.getByTestId('profileView')).toBeDefined();
    });

    // open the add car modal
    const addACarButton = screen.getByTestId('profileViewAddCarButton');
    await user.press(addACarButton);
    await waitFor(() => {
        expect(screen.getByTestId('carMakerSelectView')).toBeDefined();
    });
});