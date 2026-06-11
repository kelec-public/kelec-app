import { render } from "@testing-library/react-native";
import ChargeCard from "../../../../src/screen/loggedIn/CarsTab/CarView/ChargesView.tsx/ChargeCard";
import RenaultCharge from "../../../../src/lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import CarType, { CarTypeInterface } from "../../../../src/lib/clients/cars/carTypes/carType";
import LanguageHandler from "../../../../src/lib/model/localization/languageHandler";
import AppPreferences from "../../../../src/lib/appPreferences/model/appPreferences";
import MainContext, { MainContextType } from "../../../../src/lib/Contexts/MainContext";
import { V2GApiSession } from "../../../../src/lib/clients/carMakers/renault/v2gApiResponse";
import { setupThemes } from '../../../../__mocks__/theme-mock-helper';

const mockUseTheme = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useTheme: () => mockUseTheme(),
}));

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

const themes = setupThemes(mockUseColorScheme);
beforeEach(() => {
  mockUseTheme.mockReturnValue(themes.getLight());
});

const carInterface: CarTypeInterface = {
    brand: {
        display_name: "renault",
        name: "renault"
    },
    model: {
        display_name: "megane",
        name: "megane",
        engine_type: "ELECTRIC"
    },
    battery: {
        size: 60,
        max_ac_power: 11,
        max_dc_power: 60
    },
    chargingLimit: 100
}
const carType: CarType = new CarType(carInterface);

const languageHandler = new LanguageHandler();
const appPreferences = new AppPreferences();

const mockContext: MainContextType = {
    languageHandler: languageHandler,
    appPreferences: appPreferences
} as MainContextType;

test('should render v2g card', async () => {
    const mockV2Charge: V2GApiSession = {
        "personId": "personId",
        "vin": "VIN",
        "startDateTime": "2025-06-10T19:31:00Z",
        "endDateTime": "2025-06-11T07:16:13Z",
        "totalSessionDuration": 42314,
        "nonSmartChargeSessionDuration": 2,
        "smartChargeSessionDuration": 42300,
        "socMinReachedDateTime": "2025-06-10T19:31:02Z",
        "totalEnergyRecovered": 46.347,
        "energyDischarged": 30.311,
        "nonSmartEnergyRecovered": 0.0,
        "smartEnergyRecovered": 46.347,
        "energyMobility": 16.036,
        "sessionStartBatteryLevel": 59.0,
        "sessionEndBatteryLevel": 78.0,
        "status": "OK"
    }
    const mockCharge: RenaultCharge = RenaultCharge.convertV2GSessionsToCharges([mockV2Charge])[0];
    const { getByTestId } = render(
        <MainContext.Provider value={mockContext}>
            <ChargeCard charge={mockCharge} carType={carType} />
        </MainContext.Provider>)

    const batteryPercentageCharged = getByTestId('batteryPercentageCharged');
    expect(batteryPercentageCharged.children[0]).toBe('+');
    expect(batteryPercentageCharged.children[1]).toBe('19'); //78 - 59

    const V2GTotalkWhChargedText = getByTestId('V2GTotalkWhChargedText');
    expect(V2GTotalkWhChargedText.children[1]).toBe('46.35'); //total energy recovered 

    const V2GDischargedkWhText = getByTestId('V2GDischargedkWhText');
    expect(V2GDischargedkWhText.children[1]).toBe('30.31');

    const V2GEnergyRecoveredText = getByTestId('V2GEnergyRecoveredText');
    expect(V2GEnergyRecoveredText.children[1]).toBe('16.04');
});