import XLSX from 'xlsx';
import Charge from "../../../src/packages/kelec-charge-history/models/Charge";
import { toRows } from "../../../src/packages/kelec-charge-history/services/chargesExport";
import { mergeCharges } from "../../../src/packages/kelec-charge-history/services/chargeMonths";
import { buildImportPreview, summarizeImport } from "../../../src/packages/kelec-charge-import/services/importPreview";
import { readSpreadsheetRows } from "../../../src/packages/kelec-charge-import/services/readSpreadsheet";
import { parseChargeRow, toApiDate } from "../../../src/packages/kelec-charge-import/services/rowParser";
import { createDateParser } from "../../../src/packages/kelec-charge-import/services/dateFormat";

/** Fichier xlsx en base64, tel que l'écrit l'export (`json_to_sheet` sur des objets). */
const toXlsxBase64 = (rows: object[]): string => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Charges");
    return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
};

const previewOf = (rows: object[], existing: Charge[] = []) =>
    buildImportPreview(readSpreadsheetRows(toXlsxBase64(rows)), existing, 'DMY');

describe("versions successives de l'export", () => {
    test('mai → déc. 2024 : 7 colonnes, dates ISO, lignes dans le désordre, niveau 0', () => {
        const { newCharges, rejectedLines } = previewOf([
            { chargeStartDate: "2024-08-23T07:57:41Z", chargeEndDate: "2024-08-23T11:35:52Z", chargeDuration: 218, chargeStartBatteryLevel: 0, chargeEndBatteryLevel: 16, chargeEnergyRecovered: 10.25, chargeEndStatus: "ok" },
            { chargeStartDate: "2024-07-28T18:11:49Z", chargeEndDate: "2024-07-28T18:14:33Z", chargeDuration: 2, chargeStartBatteryLevel: 28, chargeEndBatteryLevel: 35, chargeEnergyRecovered: 4, chargeEndStatus: "ok" },
        ]);

        expect(rejectedLines).toEqual([]);
        expect(newCharges).toHaveLength(2);
        expect(newCharges[0]).toMatchObject({
            chargeStartDate: "2024-08-23T07:57:41Z",
            chargeEndDate: "2024-08-23T11:35:52Z",
            chargeDuration: 218,
            chargeStartBatteryLevel: 0,
            chargeEndBatteryLevel: 16,
            chargeEnergyRecovered: 10.25,
            chargeEndStatus: "ok",
            isV2G: false,
        });
    });

    test('déc. 2024 → juin 2025 : dates locales du téléphone', () => {
        const { newCharges } = previewOf([
            { chargeStartDate: "23/10/2024 20:39:16", chargeEndDate: "24/10/2024 03:06:48", chargeDuration: 388, chargeStartBatteryLevel: 10, chargeEndBatteryLevel: 30, chargeEnergyRecovered: 13.5, chargeEndStatus: "ok" },
        ]);
        expect(newCharges[0].chargeStartDate).toBe(toApiDate(new Date(2024, 9, 23, 20, 39, 16)));
        expect(newCharges[0].chargeEndDate).toBe(toApiDate(new Date(2024, 9, 24, 3, 6, 48)));
    });

    test('juin 2025 → oct. 2026 : colonnes de fusion (subCharges inutilisable), kilométrage, V2G', () => {
        const { newCharges, rejectedLines } = previewOf([
            {
                chargeStartDate: "10/23/2025, 8:39:16 PM", chargeEndDate: "10/24/2025, 3:06:48 AM", chargeDuration: 388,
                chargeStartBatteryLevel: 60, chargeEndBatteryLevel: 40, chargeEnergyRecovered: 0, chargeEndStatus: "ok",
                isAMergeCharge: undefined, subCharges: [], mileageAtStart: 12345, inaccurateMileage: true,
                V2GEnergyDischarged: 3.2, isV2G: true,
            },
        ]);

        expect(rejectedLines).toEqual([]);
        expect(newCharges[0]).toMatchObject({
            chargeStartDate: toApiDate(new Date(2025, 9, 23, 20, 39, 16)),
            mileageAtStart: 12345,
            inaccurateMileage: true,
            V2GEnergyDischarged: 3.2,
            isV2G: true,
            isAMergeCharge: false,
        });
    });

    test('export actuel (toRows) : une ligne fusionnée devient une charge simple', () => {
        const first = new Charge('2026-10-05T19:00:00Z', '2026-10-05T21:00:00Z', 120, 20, 45, 13, 'ok');
        const second = new Charge('2026-10-05T22:00:00Z', '2026-10-05T23:30:00Z', 90, 45, 70, 13, 'ok');
        const [merged] = mergeCharges([first, second]);

        const { newCharges } = previewOf(toRows([merged]));

        expect(newCharges).toHaveLength(1);
        expect(newCharges[0]).toMatchObject({
            chargeDuration: 210,
            chargeStartBatteryLevel: 20,
            chargeEndBatteryLevel: 70,
            chargeEnergyRecovered: 26,
            isAMergeCharge: false,
            subCharges: [],
        });
        expect(newCharges[0].getStartDate()).toEqual(first.getStartDate());
        expect(newCharges[0].getEndDate()).toEqual(second.getEndDate());
    });
});

describe('buildImportPreview', () => {
    const row = (start: string, extra: object = {}) => ({
        chargeStartDate: start, chargeEndDate: start, chargeDuration: 60,
        chargeStartBatteryLevel: 20, chargeEndBatteryLevel: 80, chargeEnergyRecovered: 30, ...extra,
    });

    test("écarte les charges déjà dans l'historique en comparant les instants, pas le texte", () => {
        const existing = [new Charge('2024-08-23T07:57:41.000Z', '2024-08-23T08:57:41Z', 60, 20, 80, 30, 'ok')];
        const preview = previewOf([row('2024-08-23T07:57:41Z'), row('2024-08-24T07:57:41Z')], existing);

        expect(preview.alreadyKnownCount).toBe(1);
        expect(preview.newCharges.map(charge => charge.chargeStartDate)).toEqual(['2024-08-24T07:57:41Z']);
    });

    test('ne garde qu\'une fois une charge présente deux fois dans le fichier', () => {
        const preview = previewOf([row('2024-08-23T07:57:41Z'), row('2024-08-23T07:57:41Z')]);
        expect(preview.newCharges).toHaveLength(1);
        expect(preview.alreadyKnownCount).toBe(1);
    });

    test('signale les lignes illisibles avec leur numéro dans le tableur', () => {
        const preview = previewOf([
            row('2024-08-23T07:57:41Z'),
            row('pas une date'),
            row('2024-08-25T07:57:41Z', { chargeStartBatteryLevel: undefined }),
            row('2024-08-26T07:57:41Z', { chargeDuration: 'abc' }),
        ]);
        expect(preview.newCharges).toHaveLength(1);
        expect(preview.rejectedLines).toEqual([3, 4, 5]);
    });

    test('accepte des nombres écrits en texte, avec une virgule décimale', () => {
        const [charge] = previewOf([row('2024-08-23T07:57:41Z', { chargeEnergyRecovered: '12,5', chargeDuration: '60' })]).newCharges;
        expect(charge.chargeEnergyRecovered).toBe(12.5);
        expect(charge.chargeDuration).toBe(60);
    });

    test('un fichier sans les colonnes attendues ne donne aucune charge', () => {
        const preview = previewOf([{ foo: 1, bar: 'baz' }]);
        expect(preview.newCharges).toEqual([]);
        expect(preview.rejectedLines).toEqual([2]);
    });
});

test('parseChargeRow lit une cellule au format date (fichier réenregistré dans un tableur)', () => {
    const start = new Date(2026, 9, 8, 14, 5, 9);
    const charge = parseChargeRow(
        { line: 2, cells: { chargeStartDate: start, chargeEndDate: start, chargeDuration: 1, chargeStartBatteryLevel: 1, chargeEndBatteryLevel: 2 } },
        createDateParser([], 'DMY'),
    );
    expect(charge?.getStartDate()).toEqual(start);
});

test('summarizeImport donne les totaux avant / après', () => {
    const existing = [new Charge('2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z', 90, 20, 40, 10.1, 'ok')];
    const preview = previewOf([
        { chargeStartDate: '2024-02-01T10:00:00Z', chargeEndDate: '2024-02-01T11:00:00Z', chargeDuration: 45, chargeStartBatteryLevel: 20, chargeEndBatteryLevel: 40, chargeEnergyRecovered: 5.2 },
    ], existing);

    expect(summarizeImport(existing, preview)).toEqual({
        charges: { before: 1, after: 2 },
        energyKwh: { before: 10.1, after: 15.3 },
        minutes: { before: 90, after: 135 },
    });
});

test("readSpreadsheetRows refuse un fichier vide ou qui n'est pas un tableur", () => {
    expect(() => readSpreadsheetRows('')).toThrow();
    expect(() => readSpreadsheetRows(Buffer.from('%PDF-1.4').toString('base64'))).toThrow();
    expect(() => readSpreadsheetRows(toXlsxBase64([]))).toThrow();
});
