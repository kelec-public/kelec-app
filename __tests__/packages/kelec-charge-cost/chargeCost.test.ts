import { computeCost } from "../../../src/packages/kelec-charge-cost/services/chargeCost";
import { FlatTariff, PeakOffPeakTariff, Tariff } from "../../../src/packages/kelec-charge-cost/models/Tariff";

// jest.config.js : TZ = Europe/Paris. Les dates ci-dessous sont en heure locale.
const local = (iso: string) => new Date(iso);

const flat = (pricePerKwh: number, validFrom: string | null = null, id = 'flat'): FlatTariff =>
    ({ id, validFrom, kind: 'flat', pricePerKwh });

const peakOffPeak = (slots: [string, string][], validFrom: string | null = null, id = 'hphc'): PeakOffPeakTariff => ({
    id, validFrom, kind: 'peakOffPeak', peakPrice: 0.3, offPeakPrice: 0.2,
    offPeakSlots: slots.map(([start, end]) => ({ start, end })),
});

const cost = (start: string, end: string, kwh: number, tariffs: Tariff[]) =>
    computeCost(local(start), local(end), kwh, tariffs);

describe("computeCost", () => {
    test("no tariff: no cost", () => {
        expect(cost("2026-03-01T10:00", "2026-03-01T12:00", 10, [])).toBeNull();
    });

    test("flat rate", () => {
        expect(cost("2026-03-01T10:00", "2026-03-01T12:00", 10, [flat(0.25)])).toBeCloseTo(2.5);
    });

    test("entirely in off-peak hours, with a slot crossing midnight", () => {
        const tariff = peakOffPeak([["22:00", "06:00"]]);
        expect(cost("2026-03-01T23:00", "2026-03-02T05:00", 12, [tariff])).toBeCloseTo(12 * 0.2);
        // la plage de la veille couvre aussi le début de journée
        expect(cost("2026-03-02T01:00", "2026-03-02T03:00", 4, [tariff])).toBeCloseTo(4 * 0.2);
    });

    test("energy is split pro rata between peak and off-peak hours", () => {
        // 20:00 → 00:00 : 2 h pleines puis 2 h creuses
        const tariff = peakOffPeak([["22:00", "06:00"]]);
        expect(cost("2026-03-01T20:00", "2026-03-02T00:00", 8, [tariff])).toBeCloseTo(4 * 0.3 + 4 * 0.2);
    });

    test("several off-peak slots", () => {
        // 12:00 → 16:00 : 12:30-14:30 creuses (2 h), le reste pleines (2 h)
        const tariff = peakOffPeak([["22:00", "06:00"], ["12:30", "14:30"]]);
        expect(cost("2026-03-01T12:00", "2026-03-01T16:00", 8, [tariff])).toBeCloseTo(4 * 0.3 + 4 * 0.2);
    });

    test("overlapping slots are counted once", () => {
        const tariff = peakOffPeak([["22:00", "06:00"], ["23:00", "02:00"]]);
        expect(cost("2026-03-01T20:00", "2026-03-02T00:00", 8, [tariff])).toBeCloseTo(4 * 0.3 + 4 * 0.2);
    });

    test("a charge over several days", () => {
        // 48 h : 16 h creuses (2 × 8 h), 32 h pleines
        const tariff = peakOffPeak([["22:00", "06:00"]]);
        expect(cost("2026-03-01T12:00", "2026-03-03T12:00", 48, [tariff])).toBeCloseTo(16 * 0.2 + 32 * 0.3);
    });

    test("daylight saving time: the night of the change lasts 7 h", () => {
        // 29 mars 2026, Europe/Paris : 02:00 → 03:00. 22:00 → 06:00 ne dure que 7 h.
        const tariff = peakOffPeak([["22:00", "06:00"]]);
        expect(cost("2026-03-28T22:00", "2026-03-29T06:00", 7, [tariff])).toBeCloseTo(7 * 0.2);
    });

    test("each charge uses the tariff valid at that time", () => {
        const tariffs = [flat(0.2, null, 'old'), flat(0.3, "2027-02-01", 'new')];
        expect(cost("2027-01-15T10:00", "2027-01-15T12:00", 10, tariffs)).toBeCloseTo(2);
        expect(cost("2027-02-15T10:00", "2027-02-15T12:00", 10, tariffs)).toBeCloseTo(3);
    });

    test("the first tariff applies to every older charge", () => {
        expect(cost("2020-06-01T10:00", "2020-06-01T12:00", 10, [flat(0.2, null)])).toBeCloseTo(2);
    });

    test("a charge across a tariff change is split pro rata", () => {
        // 1 h avant le 1er février, 5 h après
        const tariffs = [flat(0.2, null, 'old'), peakOffPeak([["22:00", "06:00"]], "2027-02-01", 'new')];
        expect(cost("2027-01-31T23:00", "2027-02-01T05:00", 6, tariffs)).toBeCloseTo(1 * 0.2 + 5 * 0.2);
    });

    test("the order of the stored tariffs does not matter", () => {
        const tariffs = [flat(0.3, "2027-02-01", 'new'), flat(0.2, null, 'old')];
        expect(cost("2027-01-15T10:00", "2027-01-15T12:00", 10, tariffs)).toBeCloseTo(2);
    });

    test("a charge without duration uses the price at its start", () => {
        const tariff = peakOffPeak([["22:00", "06:00"]]);
        expect(cost("2026-03-01T23:00", "2026-03-01T23:00", 5, [tariff])).toBeCloseTo(5 * 0.2);
        expect(cost("2026-03-01T12:00", "2026-03-01T12:00", 5, [tariff])).toBeCloseTo(5 * 0.3);
    });
});
