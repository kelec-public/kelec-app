import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import XLSX from 'xlsx';
import { keepLocalCopy, pick } from "@react-native-documents/picker";
import { readFile } from "react-native-fs";
import Account, { CarMaker } from "../../../src/lib/clients/accounts/account";
import RenaultCar from "../../../src/lib/clients/cars/renaultCar";
import UserAccount from "../../../src/lib/clients/accounts/userAccount";
import ChargesRepository from "../../../src/packages/kelec-charge-history/services/chargesRepository";

jest.useFakeTimers();

beforeEach(async () => {
    await AsyncStorage.clear();
    const car1 = new RenaultCar('vin1', 'model1', 'image1', CarMaker.RENAULT, 'AA0001AA');
    const account: Account = new Account('email', 'passwod', CarMaker.RENAULT, car1);
    await AsyncStorage.setItem('account', JSON.stringify(new UserAccount([account])));
    await AsyncStorage.setItem('kelecNextGen', "true");
    jest.mocked(Alert.alert).mockClear();
});

const mockGetBatteryStatus = jest.fn();
const mockGetChargesHistory = jest.fn();

jest.mock('../../../src/lib/clients/carMakers/renaultClient', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getBatteryStatus: mockGetBatteryStatus,
            getCockpit: jest.fn().mockResolvedValue({ hasError: true }),
            getLocation: jest.fn().mockResolvedValue({ hasError: true }),
            getChargesHistory: mockGetChargesHistory,
        }
    });
});

jest.spyOn(Alert, 'alert').mockImplementation(() => { });

import mockJSONBatteryStatus from '../mocks/mockRenaultBattery.json';
import mockJSONChargesHistory from '../mocks/mockRenaultCharges.json';
import App from "../../../App";

/** Fichier exporté : une charge déjà connue (date locale), deux nouvelles (ISO), une ligne illisible. */
const exportedFile = (): string => {
    const known = new Date('2023-11-21T20:39:16Z');
    const rows = [
        { chargeStartDate: known.toLocaleString('fr-FR'), chargeEndDate: known.toLocaleString('fr-FR'), chargeDuration: 388, chargeStartBatteryLevel: 39, chargeEndBatteryLevel: 81, chargeEnergyRecovered: 23.2 },
        { chargeStartDate: '2022-05-01T10:00:00Z', chargeEndDate: '2022-05-01T12:00:00Z', chargeDuration: 120, chargeStartBatteryLevel: 20, chargeEndBatteryLevel: 60, chargeEnergyRecovered: 20 },
        { chargeStartDate: '2022-05-03T10:00:00Z', chargeEndDate: '2022-05-03T11:00:00Z', chargeDuration: 60, chargeStartBatteryLevel: 30, chargeEndBatteryLevel: 50, chargeEnergyRecovered: 10.5 },
        { chargeStartDate: 'abc', chargeEndDate: 'abc', chargeDuration: 1, chargeStartBatteryLevel: 1, chargeEndBatteryLevel: 2 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Charges");
    return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
};

const openImportView = async () => {
    mockGetBatteryStatus.mockResolvedValueOnce({ hasError: false, apiData: mockJSONBatteryStatus });
    mockGetChargesHistory.mockResolvedValueOnce({ hasError: false, apiData: mockJSONChargesHistory });

    const user = userEvent.setup();
    render(<App />);

    await user.press(await screen.findByTestId('ChargesCard'));
    await screen.findByTestId('ChargesView');
    await user.press(screen.getByTestId('openModal'));
    await user.press(await screen.findByTestId('importButton'));
    await screen.findByTestId('ChargesImportView');
    return user;
};

test('importe les nouvelles charges du fichier choisi', async () => {
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://export.xlsx', name: 'export 1.xlsx' }] as any);
    jest.mocked(keepLocalCopy).mockResolvedValueOnce([{ status: 'success', sourceUri: 'content://export.xlsx', localUri: 'file:///cache/export%201.xlsx' }]);
    jest.mocked(readFile).mockResolvedValueOnce(exportedFile());

    const user = await openImportView();

    // rien à importer tant qu'aucun fichier n'est choisi
    expect(screen.getByTestId('confirmImportButton')).toBeDisabled();

    await user.press(screen.getByTestId('filePickerCard'));
    await screen.findByTestId('importPreview');

    expect(readFile).toHaveBeenCalledWith('/cache/export 1.xlsx', 'base64');
    expect(screen.getByTestId('filePickerCardSubtitle').props.children).toBe('export 1.xlsx');
    expect(screen.getByTestId('importPreviewChargesBefore').props.children).toBe('3');
    expect(screen.getByTestId('importPreviewChargesAfter').props.children).toBe('5');
    expect(screen.getByTestId('importPreviewAlreadyKnown')).toBeTruthy();
    expect(screen.getByTestId('importPreviewRejected')).toBeTruthy();

    await user.press(screen.getByTestId('confirmImportButton'));

    // retour à l'historique, avec les charges importées enregistrées
    await screen.findByTestId('ChargesView');
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const stored = await ChargesRepository.getCharges('vin1');
    expect(stored!.map(charge => charge.chargeStartDate)).toEqual([
        '2022-05-01T10:00:00Z',
        '2022-05-03T10:00:00Z',
        ...mockJSONChargesHistory.map(charge => charge.chargeStartDate),
    ]);
    // la charge déjà connue garde ses données (kilométrage venant de l'API)
    expect(stored![2].mileageAtStart).toBe(1234);
});

test("annuler le choix du fichier ne fait rien", async () => {
    jest.mocked(pick).mockRejectedValueOnce({ code: 'OPERATION_CANCELED' });

    const user = await openImportView();
    await user.press(screen.getByTestId('filePickerCard'));

    await waitFor(() => expect(pick).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(screen.queryByTestId('importPreview')).toBeNull();
});

test("un fichier illisible affiche une erreur", async () => {
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://photo.jpg', name: 'photo.jpg' }] as any);
    jest.mocked(keepLocalCopy).mockResolvedValueOnce([{ status: 'success', sourceUri: 'content://photo.jpg', localUri: 'file:///cache/photo.jpg' }]);
    jest.mocked(readFile).mockResolvedValueOnce(Buffer.from('not a spreadsheet').toString('base64'));

    const user = await openImportView();
    await user.press(screen.getByTestId('filePickerCard'));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('importPreview')).toBeNull();
    expect(screen.getByTestId('confirmImportButton')).toBeDisabled();
});

test("reprend les prix saisis à la main, même pour des charges déjà dans l'historique", async () => {
    // réinstallation : l'API renvoie la charge, mais son prix saisi n'est plus là
    const rows = [
        { chargeStartDate: '2023-11-21T20:39:16Z', chargeEndDate: '2023-11-22T03:06:48Z', chargeDuration: 388, chargeStartBatteryLevel: 39, chargeEndBatteryLevel: 81, chargeEnergyRecovered: 23.2, cost: 7.9, currency: 'EUR', isManualCost: true },
        { chargeStartDate: '2023-12-22T17:50:43Z', chargeEndDate: '2023-12-22T18:45:30Z', chargeDuration: 55, chargeStartBatteryLevel: 73, chargeEndBatteryLevel: 79, chargeEnergyRecovered: 50, cost: 10, currency: 'EUR', isManualCost: false },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Charges");
    jest.mocked(pick).mockResolvedValueOnce([{ uri: 'content://export.xlsx', name: 'export.xlsx' }] as any);
    jest.mocked(keepLocalCopy).mockResolvedValueOnce([{ status: 'success', sourceUri: 'content://export.xlsx', localUri: 'file:///cache/export.xlsx' }]);
    jest.mocked(readFile).mockResolvedValueOnce(XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }));

    const user = await openImportView();
    await user.press(screen.getByTestId('filePickerCard'));
    await screen.findByTestId('importPreview');

    // aucune nouvelle charge, mais un prix à reprendre : l'import reste possible
    expect(screen.getByTestId('noNewCharges')).toBeTruthy();
    expect(screen.getByTestId('importPreviewManualCosts')).toBeTruthy();
    expect(screen.getByTestId('confirmImportButton')).not.toBeDisabled();

    await user.press(screen.getByTestId('confirmImportButton'));
    await screen.findByTestId('ChargesView');
    expect(JSON.parse(await AsyncStorage.getItem('vin1/chargeCostOverrides') ?? 'null')).toEqual([
        { chargeStartDate: '2023-11-21T20:39:16.000Z', amount: 7.9 },
    ]);
});
