import { render, screen, waitFor } from "@testing-library/react-native";
import MainContext from "../../../src/lib/Contexts/MainContext";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import CarModel from "../../../src/lib/clients/cars/carModel";
import SelectACarView from "../../../src/packages/kelec-login/views/Steps/Step3/SelectACarView";
import { setupThemes } from '../../../__mocks__/theme-mock-helper';

const mockUseTheme = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useTheme: () => mockUseTheme(),
}));
const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: () => mockUseColorScheme() }));
const themes = setupThemes(mockUseColorScheme);

jest.mock('../../../src/lib/graphics/imageFetcher', () => ({ __esModule: true, default: jest.fn().mockResolvedValue('image') }));

const mockListVehicles = jest.fn();
jest.mock('../../../src/packages/kelec-login/services/createLoginSource', () => ({
    createLoginSource: () => ({ listVehicles: mockListVehicles }),
}));

const car = (vin: string) => new CarModel(vin, `model ${vin}`, 'https://x/' + vin, CarMaker.RENAULT);
const garageWith = (...vins: string[]) =>
    new UserAccount(vins[0] ?? '', vins.map(vin => new Account('e@x.fr', 'p', CarMaker.RENAULT, car(vin))));

const renderStep = (currentUser: UserAccount) => render(
    <MainContext.Provider value={{ languageHandler: { getTranslation: (key: string) => key }, currentUser } as any}>
        <SelectACarView
            navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any}
            route={{ key: 'k', name: 'SelectACarView', params: { account: new Account('e@x.fr', 'p', CarMaker.RENAULT) } } as any}
            setSelectedCar={jest.fn()}
        />
    </MainContext.Provider>,
);

beforeEach(() => {
    mockUseTheme.mockReturnValue(themes.getLight());
    mockListVehicles.mockResolvedValue([car('VIN1'), car('VIN2'), car('VIN3')]);
});

test('les voitures déjà dans le garage ne sont pas proposées', async () => {
    renderStep(garageWith('VIN1'));

    await waitFor(() => expect(screen.queryAllByTestId('carRowCard')).toHaveLength(2));
    expect(screen.queryAllByTestId('vinText').map(text => text.props.children)).toEqual(['VIN2', 'VIN3']);
});

test('plus rien à ajouter (toutes déjà ajoutées) : message générique', async () => {
    renderStep(garageWith('VIN1', 'VIN2', 'VIN3'));

    await waitFor(() => expect(screen.getByTestId('noCarToAdd').props.children).toBe('noVehicleToAdd'));
    expect(screen.queryAllByTestId('carRowCard')).toHaveLength(0);
});

test('aucune voiture sur le compte : même message', async () => {
    mockListVehicles.mockResolvedValue([]);
    renderStep(garageWith());

    await waitFor(() => expect(screen.getByTestId('noCarToAdd').props.children).toBe('noVehicleToAdd'));
});
