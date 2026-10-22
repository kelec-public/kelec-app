import Charge from "../../../src/packages/kelec-charge-history/models/Charge";
import { chargeCost, hasManualCost, sumCosts } from "../../../src/packages/kelec-charge-history/services/chargeCost";
import { mergeCharges } from "../../../src/packages/kelec-charge-history/services/chargeMonths";
import { toRows } from "../../../src/packages/kelec-charge-history/services/chargesExport";
import { ChargeCosts } from "../../../src/packages/kelec-charge-history/models/ChargeCosts";
import ChargeCostOverrides from "../../../src/packages/kelec-charge-history/models/ChargeCostOverrides";
import { Tariff } from "../../../src/packages/kelec-charge-cost";

// start, end, durée (min), % début, % fin, kWh (heure locale, TZ = Europe/Paris)
const charge = (start: string, end: string, duration: number, from: number, to: number, kwh: number) =>
    new Charge(start, end, duration, from, to, kwh, 'ok');

const flat: Tariff[] = [{ id: 'flat', validFrom: null, kind: 'flat', pricePerKwh: 0.2 }];
const hphc: Tariff[] = [{
    id: 'hphc', validFrom: null, kind: 'peakOffPeak', peakPrice: 0.3, offPeakPrice: 0.1,
    offPeakSlots: [{ start: '22:00', end: '06:00' }],
}];

describe('chargeCost', () => {
    test('no tariff: no cost', () => {
        expect(chargeCost(charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10), [])).toBeNull();
    });

    test('energy times the price of the hours of the charge', () => {
        expect(chargeCost(charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10), flat)).toBeCloseTo(2);
        // 21:00 → 23:00 : 1 h pleine, 1 h creuse
        expect(chargeCost(charge('2024-01-01T21:00:00', '2024-01-01T23:00:00', 120, 20, 40, 10), hphc)).toBeCloseTo(5 * 0.3 + 5 * 0.1);
    });

    test('V2G sessions have no cost', () => {
        const v2g = new Charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10, 'ok', false, [], undefined, undefined, 3, true);
        expect(chargeCost(v2g, flat)).toBeNull();
    });

    test('a merged charge costs the sum of its sub-charges, each at its own hours', () => {
        // 1re partie en heures pleines, 2e en heures creuses
        const day = charge('2024-01-01T12:00:00', '2024-01-01T13:00:00', 60, 20, 40, 10);
        const night = charge('2024-01-01T23:00:00', '2024-01-02T00:00:00', 60, 40, 60, 10);
        const [merged] = mergeCharges([day, night]);
        expect(merged.getIsAMergeCharge()).toBe(true);
        expect(chargeCost(merged, hphc)).toBeCloseTo(10 * 0.3 + 10 * 0.1);
    });

    test('sumCosts ignores unknown costs', () => {
        expect(sumCosts([1, null, 2])).toBe(3);
        expect(sumCosts([null])).toBeNull();
        expect(sumCosts([])).toBeNull();
    });
});

describe('export with costs', () => {
    const costs: ChargeCosts = {
        currency: 'EUR',
        costOf: c => chargeCost(c, flat),
        isManual: () => false,
        format: amount => String(amount),
    };

    test('cost (rounded) and currency columns, before the merge columns', () => {
        const [row] = toRows([charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10.333)], costs);
        expect(row).toMatchObject({ cost: 2.07, currency: 'EUR' });
        expect(row.isManualCost).toBe(false);
        expect(Object.keys(row).slice(-5)).toEqual(['cost', 'currency', 'isManualCost', 'isAMergeCharge', 'subChargesCount']);
    });

    test('no tariff: no cost columns', () => {
        const [row] = toRows([charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10)]);
        expect(row).not.toHaveProperty('cost');
        expect(row).not.toHaveProperty('currency');
        expect(row).not.toHaveProperty('isManualCost');
    });
});

describe('manual prices', () => {
    const home = charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10);
    const away = charge('2024-01-02T10:00:00', '2024-01-02T10:30:00', 30, 20, 60, 30);

    test('a charge is found by its start, within 5 seconds', () => {
        const overrides = new ChargeCostOverrides().with(away, 12.5);
        expect(overrides.get(away)).toBe(12.5);
        expect(overrides.get(charge('2024-01-02T10:00:04', '2024-01-02T10:30:00', 30, 20, 60, 30))).toBe(12.5);
        expect(overrides.get(charge('2024-01-02T10:00:06', '2024-01-02T10:30:00', 30, 20, 60, 30))).toBeNull();
        expect(overrides.get(home)).toBeNull();
    });

    test('a new price replaces the previous one; removing it goes back to the tariff', () => {
        const overrides = new ChargeCostOverrides().with(away, 12.5).with(away, 9);
        expect(overrides.toJSON()).toHaveLength(1);
        expect(overrides.get(away)).toBe(9);
        expect(overrides.without(away).isEmpty()).toBe(true);
    });

    test('the manual price wins over the tariff, even without tariff or for V2G', () => {
        const overrides = new ChargeCostOverrides().with(away, 12.5);
        expect(chargeCost(away, flat, overrides)).toBe(12.5);
        expect(chargeCost(home, flat, overrides)).toBeCloseTo(2);
        expect(chargeCost(away, [], overrides)).toBe(12.5);
        expect(chargeCost(home, [], overrides)).toBeNull();
        const v2g = new Charge('2024-01-03T10:00:00', '2024-01-03T11:00:00', 60, 20, 40, 10, 'ok', false, [], undefined, undefined, 3, true);
        expect(chargeCost(v2g, flat, new ChargeCostOverrides().with(v2g, 1))).toBe(1);
    });

    test('a merged charge adds the manual price of a sub-charge to the tariff cost of the others', () => {
        const first = charge('2024-01-01T10:00:00', '2024-01-01T11:00:00', 60, 20, 40, 10);
        const second = charge('2024-01-01T14:00:00', '2024-01-01T15:00:00', 60, 40, 60, 10);
        const [merged] = mergeCharges([first, second]);
        // le prix saisi pour la 1re sous-charge ne s'applique pas à toute la charge fusionnée (même début)
        const overrides = new ChargeCostOverrides().with(first, 5);
        expect(chargeCost(merged, flat, overrides)).toBeCloseTo(5 + 2);
        expect(hasManualCost(merged, overrides)).toBe(true);
        expect(hasManualCost(merged, new ChargeCostOverrides())).toBe(false);
    });
});
