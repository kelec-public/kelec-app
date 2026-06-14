import * as sharedPlatformsData from '../../src/lib/storage/sharedPlatformsData';
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Account, { CarMaker } from '../../src/lib/clients/accounts/account';
import App from '../../App';
import { Alert, Linking } from "react-native";
import RenaultCar from '../../src/lib/clients/cars/renaultCar';
import UserAccount from '../../src/lib/clients/accounts/userAccount';
import RenaultAccount from '../../src/lib/clients/accounts/renaultAccount';

const mockSaveNativeAccount = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativeAccount').mockImplementation(mockSaveNativeAccount);
const mockSendDataToAppleWatch = jest.fn();
const mockGetWidgetsLogs = jest.fn();
jest.spyOn(sharedPlatformsData, 'sendDataToAppleWatch').mockImplementation(mockSendDataToAppleWatch);
jest.spyOn(sharedPlatformsData, 'getWidgetsLogs').mockImplementation(mockGetWidgetsLogs);
const mocksaveNativePreferences = jest.fn();
jest.spyOn(sharedPlatformsData, 'saveNativePreferences').mockImplementation(mocksaveNativePreferences);


const mockVehicleStatus = require('../CarView/mocks/mockRenaultBattery.json');
mockVehicleStatus.plugStatus = 1;
mockVehicleStatus.chargingStatus = 1;


jest.mock('../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getVehicles: jest.fn().mockResolvedValue({
                vehicles: []
            }),
            getBatteryStatus: jest.fn().mockResolvedValue({
                hasError: false,
                apiData: mockVehicleStatus
            }),
            getCockpit: jest.fn().mockResolvedValue({
                hasError: false,
                apiData: require('../CarView/mocks/mockRenaultCockpit.json')
            }),
            getLocation: jest.fn().mockResolvedValue({
                hasError: false,
                apiData: require('../CarView/mocks/mockRenaultLocation.json')
            }),
            getChargesHistory: jest.fn().mockResolvedValue({
                hasError: true
            }),
            getHVACStatus: jest.fn().mockResolvedValue({
                hasError: false,
                apiData: require('../CarView/mocks/mockRenaultHVACStatus.json')
            }),
            getChargeSettings: jest.fn().mockResolvedValue({ hasError: true }),
        }
    });
});
const openURL = jest.fn();
jest.spyOn(Linking, 'openURL').mockImplementation(openURL);

jest.useFakeTimers();

beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    const userAccount: UserAccount = new UserAccount('vin1', [account]);
    await AsyncStorage.setItem('account', JSON.stringify(userAccount));
    await AsyncStorage.setItem('kelecNextGen', "true");
});

test('should render the settings view', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);

    await waitFor(() => {
        expect(screen.getByTestId('settingsView')).toBeDefined();
    });
});

test('should open my linkedin page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const linkedinButton = screen.getByTestId('linkedinButton');
    await user.press(linkedinButton);
    await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('https://www.linkedin.com/in/kelyan-pegeotselme/');
    });
});

test('should send a feedback', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
        expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const feedbackButton = screen.getByTestId('testSettingRowfeedback');
    await user.press(feedbackButton);
    await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('mailto:contact@kelec.app?subject=Kelec Feedback');
    });
});

test('should help translate the app', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const actionButton = screen.getByTestId('testSettingRowlanguage');
    await user.press(actionButton);
    await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('https://translate.kelec.app');
    });
});

test('should help join discord server', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const actionButton = screen.getByTestId('testSettingRowgroup');
    await user.press(actionButton);
    await waitFor(() => {
        expect(openURL).toHaveBeenCalledWith('https://discord.gg/ntJayVBYGV');
    });
});

test('should log out', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const actionButton = screen.getByTestId('testSettingRowlogout');
    await user.press(actionButton);
    await waitFor(async () => {
        expect(mockSaveNativeAccount).toHaveBeenCalledWith(null);
        const account = await AsyncStorage.getItem('account');
        expect(account).toBeNull();
    });
});

test('should update the app preferences for miles', async () => {
    const user = userEvent.setup();
    render(<App />);

    // check it's km by default
    await waitFor(() => {
        const summaryCardRange = screen.getByTestId('summaryCardRange');
        expect(summaryCardRange.props.children[0]).toBe(202);
        expect(summaryCardRange.props.children[1].props.children).toBe(' km');

        const summaryCardOdometer = screen.getByTestId('summaryCardOdometer');
        expect(summaryCardOdometer.props.children[0]).toBe("30 995");
        expect(summaryCardOdometer.props.children[1].props.children).toBe(' km');
    });

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    let actionButton = screen.getByTestId('testSettingRowdirections-car');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(appPreferences).toBeDefined();
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ displayMiles: true });
    });

    const bottomButtoncars = screen.queryAllByTestId('bottomButtondirections-car');
    await user.press(bottomButtoncars[0]);
    await waitFor(() => {
        const summaryCardRange = screen.getByTestId('summaryCardRange');
        expect(summaryCardRange.props.children[0]).toBe(202);
        expect(summaryCardRange.props.children[1].props.children).toBe(' mi');

        const summaryCardOdometer = screen.getByTestId('summaryCardOdometer');
        expect(summaryCardOdometer.props.children[0]).toBe("19 259");
        expect(summaryCardOdometer.props.children[1].props.children).toBe(' mi');

        expect(mocksaveNativePreferences).toHaveBeenCalledTimes(1);
    });

    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const signpost = screen.getByTestId('testSettingRowsignpost');
    await user.press(signpost);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ displayMiles: true, convertToMiles: true });
    });

    await user.press(screen.queryAllByTestId('bottomButtondirections-car')[0]);
    await waitFor(() => {
        const summaryCardRange = screen.getByTestId('summaryCardRange');
        expect(summaryCardRange.props.children[0]).toBe(126);
        expect(summaryCardRange.props.children[1].props.children).toBe(' mi');

        const summaryCardOdometer = screen.getByTestId('summaryCardOdometer');
        expect(summaryCardOdometer.props.children[0]).toBe("19 259");
        expect(summaryCardOdometer.props.children[1].props.children).toBe(' mi');
    });

    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    actionButton = screen.getByTestId('testSettingRowdirections-car');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ displayMiles: false, convertToMiles: false });
    });

    await user.press(screen.queryAllByTestId('bottomButtondirections-car')[0]);
    await waitFor(() => {
        const summaryCardRange = screen.getByTestId('summaryCardRange');
        expect(summaryCardRange.props.children[0]).toBe(202);
        expect(summaryCardRange.props.children[1].props.children).toBe(' km');

        expect(mocksaveNativePreferences).toHaveBeenCalledTimes(3);
    });
});

test('should update the app preferences highlightDCCharges', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));
    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    let actionButton = screen.getByTestId('testSettingRowev-plug-ccs2');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ highlightDCCharges: true });
    });

    actionButton = screen.getByTestId('testSettingRowev-plug-ccs2');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ highlightDCCharges: false });
    });
});

test('should update the app preferences show charging power', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));
    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    let actionButton = screen.getByTestId('testSettingRowbolt');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ displayChargingPower: true });
    });

    await user.press(screen.queryAllByTestId('bottomButtondirections-car')[0]);
    await waitFor(() => expect(screen.getByTestId('chargingPowerText')).toBeDefined());

    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    actionButton = screen.getByTestId('testSettingRowbolt');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(JSON.parse(appPreferences ?? "")).toMatchObject({ displayChargingPower: false });
    });

    await user.press(screen.queryAllByTestId('bottomButtondirections-car')[0]);
    await waitFor(() => {
        expect(() => screen.getByTestId('chargingPowerText')).toThrow();
    });
});

test('should send the account to the apple watch', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));
    await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
    await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

    const actionButton = screen.getByTestId('testSettingRowwatch');
    await user.press(actionButton);
    await waitFor(() => expect(mockSendDataToAppleWatch).toHaveBeenCalled());
});

describe('export widgets logs', () => {
    test('should export widgets logs', async () => {
        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));
        await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
        await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

        const actionButton = screen.getByTestId('testSettingRownewspaper');
        await user.press(actionButton);
        await waitFor(() => expect(mockGetWidgetsLogs).toHaveBeenCalled());
    });

    test('should not export empty logs', async () => {
        const user = userEvent.setup();
        render(<App />);

        const alertMock = jest.fn();
        jest.spyOn(Alert, 'alert').mockImplementation(alertMock);
        mockGetWidgetsLogs.mockImplementation(() => Promise.resolve(null));

        await waitFor(() => expect(screen.queryAllByTestId('bottomButtonperson').length).toBe(2));
        await user.press(screen.queryAllByTestId('bottomButtonsettings')[0]);
        await waitFor(() => expect(screen.getByTestId('settingsView')).toBeDefined());

        const actionButton = screen.getByTestId('testSettingRownewspaper');
        await user.press(actionButton);
        await waitFor(() => {
            expect(mockGetWidgetsLogs).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalledWith("No logs found");
        });
    });
});
describe("hide map", () => {
    test("should hide and show the map", async () => {
        const user = userEvent.setup();

        render(<App />);

        // first, check that the map is actually here
        await waitFor(async () => {
            expect(screen.getByTestId('mapCard')).toBeDefined();
        })

        await waitFor(async () => {
            const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
            expect(bottomButtonperson.length).toBe(2);
        });

        let bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
        await user.press(bottomButtonperson[0]);
        await waitFor(async () => {
            expect(screen.getByTestId('settingsView')).toBeDefined();
        });


        // Make sure map is hidden
        await waitFor(() => {
            const mapCards = screen.queryAllByTestId('mapCard');
            expect(mapCards.length).toBe(0);
        });

        // Press action button
        let actionButton = screen.getByTestId('testSettingRowmap');
        await user.press(actionButton);

        await waitFor(async () => {
            let appPreferences = await AsyncStorage.getItem('appPreferences');
            appPreferences = JSON.parse(appPreferences ?? "{}");
            expect(appPreferences).toMatchObject({ hideMap: true });
        });

        // go back to carview to check if the map is here
        const bottomButtonCarView = screen.queryAllByTestId('bottomButtondirections-car');
        await user.press(bottomButtonCarView[0]);
        await waitFor(() => {
            // make sure the mapView is not here
            const mapCard = screen.queryAllByTestId('mapCard');
            expect(mapCard.length).toBe(0);
        })

        // now go back to settings to show back map
        bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
        await user.press(bottomButtonperson[0]);
        await waitFor(() => {
            expect(screen.getByTestId('settingsView')).toBeDefined();
        });

        // toggle back map
        // make sure the map is hidden
        await waitFor(() => {
            const mapCard = screen.queryAllByTestId('mapCard');
            expect(mapCard.length).toBe(0);
        });


        actionButton = screen.getByTestId('testSettingRowmap');
        await user.press(actionButton);
        await waitFor(async () => {
            let appPreferences = await AsyncStorage.getItem('appPreferences');
            appPreferences = JSON.parse(appPreferences ?? "{}");
            expect(appPreferences).toBeDefined();
            expect(appPreferences).toMatchObject({
                hideMap: false
            })
        });

        // now go back to the main CarView
        const bottomButtoncarView = screen.queryAllByTestId('bottomButtondirections-car');
        await user.press(bottomButtoncarView[0]);
        await waitFor(() => {
            // map card should be here
            expect(screen.getByTestId('mapCard')).toBeDefined();
        })
    });
});

test('should display app version', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);

    await waitFor(() => {
        expect(screen.getByTestId('settingsView')).toBeDefined();
    });

    const pkg = require('../../package.json');
    const appVersion = screen.getByTestId('appVersion');
    expect(appVersion.props.children).toContain(pkg.version);
});

describe('should display the names on top of settingsview', () => {
    it('should not display the names on top of settingsview', async () => {
        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => {
            const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
            expect(bottomButtonperson.length).toBe(2);
        });

        const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
        await user.press(bottomButtonperson[0]);

        await waitFor(() => {
            expect(screen.getByTestId('settingsView')).toBeDefined();
        });

        const settingsTitle = screen.getByTestId('settingsTitle');
        expect(settingsTitle.props.children).toBe('RÉGLAGES');
    });

    it('should display the names on top of settingsview', async () => {
        await AsyncStorage.clear();
        const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
        const account: RenaultAccount = new RenaultAccount('email', 'password', 'accountID', car1, 'firstName', 'lastName');
        const userAccount: UserAccount = new UserAccount('vin1', [account]);
        await AsyncStorage.setItem('account', JSON.stringify(userAccount));
        await AsyncStorage.setItem('kelecNextGen', 'true');

        const user = userEvent.setup();
        render(<App />);

        await waitFor(() => {
            const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
            expect(bottomButtonperson.length).toBe(2);
        });

        const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
        await user.press(bottomButtonperson[0]);

        await waitFor(() => {
            expect(screen.getByTestId('settingsView')).toBeDefined();
        });

        const settingsTitle = screen.getByTestId('settingsTitle');
        expect(settingsTitle.props.children[0]).toBe('FIRSTNAME');
        expect(settingsTitle.props.children[2]).toBe('LASTNAME');
    });
});

test('should update the app preferences merge charges', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
        const bottomButtonperson = screen.queryAllByTestId('bottomButtonperson');
        expect(bottomButtonperson.length).toBe(2);
    });

    const bottomButtonperson = screen.queryAllByTestId('bottomButtonsettings');
    await user.press(bottomButtonperson[0]);

    await waitFor(() => {
        expect(screen.getByTestId('settingsView')).toBeDefined();
    });

    // Enable mergeCharges
    let actionButton = screen.getByTestId('testSettingRowmerge');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(appPreferences).toBeDefined();
        expect(JSON.parse(appPreferences ?? '')).toMatchObject({ mergeCharges: true });
    });

    // Disable mergeCharges
    actionButton = screen.getByTestId('testSettingRowmerge');
    await user.press(actionButton);
    await waitFor(async () => {
        const appPreferences = await AsyncStorage.getItem('appPreferences');
        expect(appPreferences).toBeDefined();
        expect(JSON.parse(appPreferences ?? '')).toMatchObject({ mergeCharges: false });
    });
});