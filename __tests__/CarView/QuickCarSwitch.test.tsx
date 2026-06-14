import AsyncStorage from "@react-native-async-storage/async-storage";
import App from "../../App";
import HyundaiCar from "../../src/lib/clients/cars/hyundaiCar";
import Account, { CarMaker } from "../../src/lib/clients/accounts/account";
import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import UserAccount from "../../src/lib/clients/accounts/userAccount";
jest.useFakeTimers();
beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

test('should not display the quick car switch button', async () => {
    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(() => { getByTestId("carChoiceIconvin1"); }).toThrow();
    });
});

test('should display the quick car switch button', async () => {
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const car2 = new HyundaiCar('vin2', 'model2', 'image2', CarMaker.HYUNDAI, 'AA0002AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const account2: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car2);
    const userAccount: UserAccount = new UserAccount('vin1', [account, account2]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");

    const { getByTestId } = render(<App />);
    await waitFor(() => {
        expect(getByTestId("carChoiceIconvin1")).toBeDefined();
        expect(getByTestId("carChoiceIconvin2")).toBeDefined();
    });
});

test('should display the quick car switch button and change the car', async () => {
    await AsyncStorage.clear();
    const car1 = new HyundaiCar('vin1', 'model1', 'image1', CarMaker.HYUNDAI, 'AA0001AA');
    const car2 = new HyundaiCar('vin2', 'model2', 'image2', CarMaker.HYUNDAI, 'AA0002AA');
    const account: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car1);
    const account2: Account = new Account('email', 'passwod', CarMaker.HYUNDAI, car2);
    const userAccount: UserAccount = new UserAccount('vin1', [account, account2]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("carChoiceIconvin1");
    await screen.findByTestId("carChoiceIconvin2");

    let carChoiceButton = screen.getByTestId("carChoiceIconvin2");
    await user.press(carChoiceButton);
    await waitFor(() => {
        expect(screen.getByTestId("carChoicevin1")).toBeDefined();
        expect(screen.getByTestId("carChoicevin2")).toBeDefined();
    });

    // now close the modal 
    const carChoiceModalClose = screen.getByTestId("carChoiceModalCloseButton");
    await user.press(carChoiceModalClose);
    await waitFor(() => {
        expect(() => { screen.getByTestId("carChoicevin1"); }).toThrow();
        expect(() => { screen.getByTestId("carChoicevin2"); }).toThrow();
    });

    // open it again 
    carChoiceButton = await screen.findByTestId("carChoiceIconvin2");
    await user.press(carChoiceButton);
    await waitFor(() => {
        expect(screen.getByTestId("carChoicevin1")).toBeDefined();
        expect(screen.getByTestId("carChoicevin2")).toBeDefined();
    });


    carChoiceButton = screen.getByTestId("carChoicevin2");
    await user.press(carChoiceButton);

});