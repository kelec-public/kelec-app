import Charge from "../../../src/packages/kelec-charge-history/models/Charge";
import { Filter, FilterName, FilterUnit } from "../../../src/packages/kelec-charge-history/models/Filter";
import { applyFilters, formatFilterLabel, removeFilter, upsertFilter } from "../../../src/packages/kelec-charge-history/services/chargesFilters";
import { buildChargeMonths, countMonths, getMonthDays, mergeCharges, selectCharges } from "../../../src/packages/kelec-charge-history/services/chargeMonths";
import { toRows } from "../../../src/packages/kelec-charge-history/services/chargesExport";

// start, end, durée (min), % début, % fin, kWh
const charge = (start: string, end: string, duration: number, from: number, to: number, kwh: number) =>
    new Charge(start, end, duration, from, to, kwh, 'ok');

const jan1 = charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10);   // 10 kW
const jan15 = charge('2024-01-15T10:00:00', '2024-01-15T10:30:00', 30, 40, 80, 25);  // 50 kW
const feb2 = charge('2024-02-02T10:00:00', '2024-02-02T12:30:00', 150, 10, 60, 30);  // 12 kW
const mar3 = charge('2024-03-03T10:00:00', '2024-03-03T10:45:00', 45, 30, 50, 9.999);
const charges = [jan1, jan15, feb2, mar3];
// Prolonge jan1 (40 %, 3 h après) : fusionnable avec elle.
const jan1Evening = charge('2024-01-01T14:00:00', '2024-01-01T14:30:00', 30, 40, 80, 25);

const powerFilter = (min: number, max: number): Filter => ({
    displayName: 'averagePower',
    filterName: FilterName.AVERAGE_POWER,
    filterType: { min, max, unit: FilterUnit.KW },
});

describe('chargesFilters', () => {
    test('applyFilters combine tous les filtres', () => {
        expect(applyFilters([], charges)).toEqual(charges);
        expect(applyFilters([powerFilter(11, 60)], charges)).toEqual([jan15, feb2, mar3]);
        expect(applyFilters([powerFilter(11, 60), {
            displayName: 'showOnlyDcCharges',
            filterName: FilterName.ONLY_DC,
            filterType: { isActive: true },
        }], charges)).toEqual([jan15]);
    });

    test('le filtre date inclut les journées entières, quelle que soit l\'heure sélectionnée', () => {
        const dateFilter = (startDate?: Date, endDate?: Date): Filter => ({
            displayName: 'date',
            filterName: FilterName.DATE,
            filterType: { startDate, endDate },
        });
        // sélection faite à 11h : les charges de 10h le 1er et le 15 doivent rester
        expect(applyFilters([dateFilter(new Date('2024-01-01T11:00:00'))], charges)).toEqual(charges);
        expect(applyFilters([dateFilter(undefined, new Date('2024-01-15T09:00:00'))], charges)).toEqual([jan1, jan15]);
        expect(applyFilters([dateFilter(new Date('2024-01-15T23:00:00'), new Date('2024-02-02T08:00:00'))], charges)).toEqual([jan15, feb2]);
    });

    test('upsertFilter remplace un filtre du même nom, removeFilter le retire', () => {
        const filters = upsertFilter(upsertFilter([], powerFilter(0, 10)), powerFilter(5, 20));
        expect(filters).toEqual([powerFilter(5, 20)]);
        expect(removeFilter(filters, FilterName.AVERAGE_POWER)).toEqual([]);
    });

    test('formatFilterLabel masque les bornes non renseignées', () => {
        const translate = (key: string) => key.toUpperCase();
        expect(formatFilterLabel(powerFilter(0, 9999), translate)).toBe('AVERAGEPOWER');
        expect(formatFilterLabel(powerFilter(5, 20), translate)).toBe('5kW < AVERAGEPOWER < 20kW');
    });
});

describe('chargeMonths', () => {
    test('buildChargeMonths regroupe, trie et limite le nombre de mois', () => {
        const months = buildChargeMonths(charges, [], { merge: false, monthLimit: 2 });
        expect(months.map(m => m.monthYear)).toEqual(['2-2024', '1-2024']);

        const asc = buildChargeMonths(charges, [], { merge: false, sortDesc: false, monthLimit: 5 });
        expect(asc.map(m => m.monthYear)).toEqual(['0-2024', '1-2024', '2-2024']);
        expect(asc[0].charges).toEqual([jan1, jan15]);
        expect(asc[0].totalEnergyRecovered).toBe(35);
        expect(asc[0].totalTimeCharged).toEqual([1, 30]);
        expect(asc[1].totalTimeCharged).toEqual([2, 30]);
        expect(asc[2].totalEnergyRecovered).toBe(10);
    });

    test('buildChargeMonths ne modifie pas le tableau reçu', () => {
        const input = [...charges];
        buildChargeMonths(input, [], { merge: false });
        expect(input).toEqual(charges);
    });

    test('countMonths compte les mois après filtrage', () => {
        expect(countMonths(charges, [], false)).toBe(3);
        expect(countMonths(charges, [powerFilter(40, 60)], false)).toBe(1);
    });

    test('countMonths ne compte pas un mois dont les charges ont été fusionnées dans le mois précédent', () => {
        const jan31 = charge('2024-01-31T22:00:00', '2024-01-31T23:00:00', 60, 20, 50, 15);
        const feb1 = charge('2024-02-01T01:00:00', '2024-02-01T02:00:00', 60, 50, 80, 15);
        expect(countMonths([jan31, feb1], [], false)).toBe(2);
        expect(countMonths([jan31, feb1], [], true)).toBe(1);
    });

    test('selectCharges fusionne même si les charges reçues ne sont pas triées', () => {
        const selected = selectCharges([feb2, jan1Evening, jan1], [], { merge: true, sortDesc: true });
        expect(selected).toHaveLength(2);
        expect(selected[0]).toBe(feb2);
        expect(selected[1].getSubCharges()).toEqual([jan1, jan1Evening]);

        const asc = selectCharges([feb2, jan1Evening, jan1], [], { merge: false, sortDesc: false });
        expect(asc).toEqual([jan1, jan1Evening, feb2]);
    });

    test('mergeCharges fusionne les charges qui se suivent', () => {
        const merged = mergeCharges([jan1, jan1Evening, feb2]);
        expect(merged).toHaveLength(2);
        expect(merged[0].getIsAMergeCharge()).toBe(true);
        expect(merged[0].getSubCharges()).toEqual([jan1, jan1Evening]);
        expect(merged[0].getStartPercentage()).toBe(20);
        expect(merged[0].getEndPercentage()).toBe(80);
        expect(merged[0].getEnergyRecovered()).toBe(35);
        expect(merged[1]).toBe(feb2);
    });

    test('mergeCharges tolère 1 % d\'écart sur le niveau de batterie', () => {
        const at = (from: number) => charge('2024-01-01T12:00:00', '2024-01-01T13:00:00', 60, from, 90, 10);
        expect(mergeCharges([jan1, at(39)])).toHaveLength(1);
        expect(mergeCharges([jan1, at(41)])).toHaveLength(1);
        expect(mergeCharges([jan1, at(38)])).toHaveLength(2);
        expect(mergeCharges([jan1, at(42)])).toHaveLength(2);
    });

    test('mergeCharges ne fusionne que si la charge suivante commence moins de 12 h après', () => {
        // jan1 se termine le 1er janvier à 11 h
        const startingAt = (start: string) => charge(start, '2024-01-02T12:00:00', 60, 40, 90, 10);
        expect(mergeCharges([jan1, startingAt('2024-01-01T22:59:00')])).toHaveLength(1);
        expect(mergeCharges([jan1, startingAt('2024-01-01T23:00:00')])).toHaveLength(2);
        expect(mergeCharges([jan1, jan15])).toHaveLength(2); // même niveau mais 14 jours plus tard
    });

    test('mergeCharges ne fusionne pas une charge V2G avec une charge classique', () => {
        const v2g = new Charge('2024-01-01T12:00:00', '2024-01-01T13:00:00', 60, 40, 30, 0, 'ok', false, [], undefined, undefined, 3, true);
        expect(mergeCharges([jan1, v2g])).toHaveLength(2);
    });

    test('getMonthDays marque les jours chargés, DC et futurs', () => {
        const [january] = buildChargeMonths(charges, [], { merge: false, sortDesc: false, monthLimit: 1 });
        const days = getMonthDays(january, new Date('2024-01-20T12:00:00'));

        expect(days).toHaveLength(31);
        expect(days[0]).toEqual({ day: 1, hasCharge: true, hasDCCharge: false, isFuture: false });
        expect(days[14]).toEqual({ day: 15, hasCharge: true, hasDCCharge: true, isFuture: false });
        expect(days[1].hasCharge).toBe(false);
        expect(days[20].isFuture).toBe(true);
    });
});

describe('chargesExport', () => {
    test('toRows remplace le détail des sous-charges par leur nombre', () => {
        const [merged, single] = mergeCharges([jan1, jan1Evening, feb2]);
        const [mergedRow, singleRow] = toRows([merged, single]);

        expect(mergedRow.isAMergeCharge).toBe(true);
        expect(mergedRow.subChargesCount).toBe(2);
        expect(mergedRow).not.toHaveProperty('subCharges');
        expect(mergedRow.chargeStartDate).toBe(jan1.getStartDate().toLocaleString());
        expect(mergedRow.chargeEndDate).toBe(jan1Evening.getEndDate().toLocaleString());

        expect(singleRow.isAMergeCharge).toBe(false);
        expect(singleRow.subChargesCount).toBe(0);
        expect(Object.keys(singleRow).slice(-2)).toEqual(['isAMergeCharge', 'subChargesCount']);
    });
});
