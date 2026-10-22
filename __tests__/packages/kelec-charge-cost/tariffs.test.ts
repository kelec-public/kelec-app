import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlatTariff, Tariff } from "../../../src/packages/kelec-charge-cost/models/Tariff";
import { draftFromTariff, newDraft, parsePrice, tariffFromDraft } from "../../../src/packages/kelec-charge-cost/models/tariffDraft";
import { canDeleteTariff, deleteTariff, tariffEnd, tariffStatus, upsertTariff, withPeriod } from "../../../src/packages/kelec-charge-cost/services/tariffList";
import { TariffRepository } from "../../../src/packages/kelec-charge-cost/services/tariffRepository";
import { currencySymbol, formatKwhPrice, formatPrice, formatPricePerKwh } from "../../../src/packages/kelec-charge-cost/services/priceFormat";
import { formatDuration, offPeakMinutesPerDay, offPeakRanges, offPeakSaving, peakSlots } from "../../../src/packages/kelec-charge-cost/services/offPeakSummary";

const flat = (id: string, validFrom: string | null, pricePerKwh = 0.2): FlatTariff =>
    ({ id, validFrom, kind: 'flat', pricePerKwh });

describe("tariff draft", () => {
    test("the first tariff starts from the beginning, the next ones today", () => {
        const today = new Date(2026, 9, 17);
        expect(newDraft('a', [], today).validFrom).toBeNull();
        expect(newDraft('b', [flat('a', null)], today).validFrom).toBe('2026-10-17');
    });

    test("prices accept a comma or a dot", () => {
        expect(parsePrice("0,2516")).toBe(0.2516);
        expect(parsePrice(" 0.27 ")).toBe(0.27);
        expect(parsePrice("")).toBeNull();
        expect(parsePrice("-1")).toBeNull();
        expect(parsePrice("abc")).toBeNull();
    });

    test("flat rate", () => {
        const draft = { ...newDraft('a', [], new Date()), pricePerKwh: "0,25" };
        expect(tariffFromDraft(draft)).toEqual({ ok: true, value: { id: 'a', validFrom: null, kind: 'flat', pricePerKwh: 0.25 } });
        expect(tariffFromDraft({ ...draft, pricePerKwh: "" })).toEqual({ ok: false, errorKey: 'invalidPrice' });
    });

    test("peak / off-peak: prices and at least one valid slot", () => {
        const draft = { ...newDraft('a', [], new Date()), kind: 'peakOffPeak' as const, peakPrice: "0.27", offPeakPrice: "0.21" };
        expect(tariffFromDraft(draft)).toMatchObject({ ok: true, value: { peakPrice: 0.27, offPeakPrice: 0.21, offPeakSlots: [{ start: '22:00', end: '06:00' }] } });
        expect(tariffFromDraft({ ...draft, offPeakPrice: "" })).toEqual({ ok: false, errorKey: 'invalidPrice' });
        expect(tariffFromDraft({ ...draft, offPeakSlots: [] })).toEqual({ ok: false, errorKey: 'addAtLeastOneOffPeakSlot' });
        expect(tariffFromDraft({ ...draft, offPeakSlots: [{ start: '22:00', end: '22:00' }] })).toEqual({ ok: false, errorKey: 'invalidOffPeakSlot' });
    });

    test("off-peak slots cannot overlap", () => {
        const draft = { ...newDraft('a', [], new Date()), kind: 'peakOffPeak' as const, peakPrice: "0.27", offPeakPrice: "0.21" };
        const withSlots = (...slots: [string, string][]) =>
            tariffFromDraft({ ...draft, offPeakSlots: slots.map(([start, end]) => ({ start, end })) });
        const overlap = { ok: false, errorKey: 'offPeakSlotsOverlap' };
        // plage qui passe minuit, puis une plage dans sa partie du matin
        expect(withSlots(['22:00', '06:00'], ['03:00', '07:00'])).toEqual(overlap);
        // … ou dans sa partie du soir
        expect(withSlots(['22:00', '06:00'], ['21:00', '23:00'])).toEqual(overlap);
        expect(withSlots(['12:00', '14:00'], ['13:00', '15:00'])).toEqual(overlap);
        expect(withSlots(['12:00', '16:00'], ['13:00', '14:00'])).toEqual(overlap);
        expect(withSlots(['22:00', '06:00'], ['23:00', '01:00'])).toEqual(overlap);
        // plages qui se touchent, ou séparées : acceptées
        expect(withSlots(['22:00', '06:00'], ['06:00', '07:00']).ok).toBe(true);
        expect(withSlots(['22:00', '06:00'], ['12:30', '14:30']).ok).toBe(true);
        expect(withSlots(['20:00', '22:00'], ['22:00', '06:00']).ok).toBe(true);    });

    test("editing a tariff starts from its values", () => {
        const tariff: Tariff = { id: 'a', validFrom: '2027-02-01', kind: 'peakOffPeak', peakPrice: 0.27, offPeakPrice: 0.21, offPeakSlots: [{ start: '12:30', end: '14:30' }] };
        expect(tariffFromDraft(draftFromTariff(tariff))).toEqual({ ok: true, value: tariff });
    });
});

describe("tariff list", () => {
    const tariffs = [flat('first', null), flat('second', '2027-02-01')];

    test("adds a tariff, sorted by start date", () => {
        const result = upsertTariff(tariffs, flat('third', '2026-06-01'));
        expect(result.ok && result.value.map(t => t.id)).toEqual(['first', 'third', 'second']);
    });

    test("edits a tariff by its id, even when its date changes", () => {
        const result = upsertTariff(tariffs, flat('second', '2028-01-01', 0.3));
        expect(result.ok && result.value).toEqual([flat('first', null), flat('second', '2028-01-01', 0.3)]);
    });

    test("two tariffs cannot start on the same day", () => {
        expect(upsertTariff(tariffs, flat('third', '2027-02-01'))).toEqual({ ok: false, errorKey: 'tariffSameStartDate' });
    });

    test("only the first tariff has no start date", () => {
        expect(upsertTariff(tariffs, flat('first', '2026-01-01'))).toEqual({ ok: false, errorKey: 'tariffStartDateRequired' });
        expect(upsertTariff(tariffs, flat('third', null))).toEqual({ ok: false, errorKey: 'tariffStartDateRequired' });
        expect(upsertTariff([], flat('first', null)).ok).toBe(true);
    });

    test("the first tariff can only be deleted when it is alone", () => {
        expect(canDeleteTariff(tariffs, 'first')).toBe(false);
        expect(deleteTariff(tariffs, 'first')).toEqual({ ok: false, errorKey: 'cannotDeleteFirstTariff' });
        expect(deleteTariff(tariffs, 'second')).toEqual({ ok: true, value: [flat('first', null)] });
        expect(canDeleteTariff([flat('first', null)], 'first')).toBe(true);
    });

    test("a tariff ends the day before the next one starts", () => {
        expect(tariffEnd(tariffs, 'first')).toBe('2027-01-31');
        expect(tariffEnd(tariffs, 'second')).toBeNull();
        expect(tariffEnd([flat('first', null), flat('second', '2028-03-01')], 'first')).toBe('2028-02-29');
    });

    test("the period of a tariff being entered is placed among the others", () => {
        expect(tariffEnd(tariffs, 'unknown')).toBeNull();
        // nouveau tarif au milieu : il s'arrête la veille du suivant, et le précédent la veille de lui
        const entered = withPeriod(tariffs, { id: 'new', validFrom: '2026-06-01' });
        expect(tariffEnd(entered, 'new')).toBe('2027-01-31');
        expect(tariffEnd(entered, 'first')).toBe('2026-05-31');
        // tarif modifié : sa nouvelle date remplace l'ancienne
        expect(tariffEnd(withPeriod(tariffs, { id: 'second', validFrom: null }), 'second')).toBeNull();
    });
});

describe("TariffRepository", () => {
    beforeEach(async () => {
        await AsyncStorage.clear();
    });

    test("nothing stored: no tariff, in euros", async () => {
        expect(await TariffRepository.get()).toEqual({ currency: 'EUR', tariffs: [] });
    });

    test("listeners get each saved version until they unsubscribe", async () => {
        const listener = jest.fn();
        const unsubscribe = TariffRepository.subscribe(listener);
        await TariffRepository.save({ currency: 'EUR', tariffs: [flat('second', '2027-02-01'), flat('first', null)] });
        expect(listener).toHaveBeenCalledWith({ currency: 'EUR', tariffs: [flat('first', null), flat('second', '2027-02-01')] });
        unsubscribe();
        await TariffRepository.save({ currency: 'EUR', tariffs: [] });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test("saves under the global key, sorted", async () => {
        await TariffRepository.save({ currency: 'NOK', tariffs: [flat('second', '2027-02-01'), flat('first', null)] });
        const stored = JSON.parse(await AsyncStorage.getItem('electricityTariffs') ?? 'null');
        expect(stored).toEqual({ currency: 'NOK', tariffs: [flat('first', null), flat('second', '2027-02-01')] });
        expect(await TariffRepository.get()).toEqual(stored);
    });
});

describe("price format", () => {
    test("formats each currency", () => {
        // format de la machine (« 3,42 € » en fr, « €3.42 » en en-US) : on ne vérifie pas la place du symbole
        expect(formatPrice(3.42, 'EUR')).toMatch(/3[,.]42/);
        expect(formatPrice(3.42, 'EUR')).toContain('€');
        expect(formatPrice(3.42, 'GBP')).toMatch(/3[,.]42/);
        expect(formatPrice(3.42, 'GBP')).toContain('£');
        expect(formatPricePerKwh(0.2516, 'EUR')).toMatch(/0[,.]2516/);
        expect(formatPricePerKwh(0.2516, 'EUR')).toMatch(/€.*\/kWh$/);
        // devise sans centimes : on garde quand même les décimales d'un prix au kWh
        expect(formatPricePerKwh(25.5, 'ISK')).toMatch(/25[,.]50/);
        expect(formatPrice(3.42, 'CHF')).toMatch(/3[,.]42/);
    });

    test("price per kWh without the currency", () => {
        expect(formatKwhPrice(0.14)).toMatch(/^0[,.]14$/);
        expect(formatKwhPrice(0.2516)).toMatch(/^0[,.]2516$/);
    });

    test("currency symbol", () => {
        expect(currencySymbol('EUR')).toBe('€');
        expect(currencySymbol('GBP')).toBe('£');
    });
});

describe("off-peak summary", () => {
    test("a slot over midnight is split for the timeline", () => {
        expect(offPeakRanges([{ start: '22:00', end: '06:00' }, { start: '12:30', end: '14:00' }]))
            .toEqual([[1320, 1440], [0, 360], [750, 840]]);
    });

    test("total per day, overlapping time counted once", () => {
        expect(offPeakMinutesPerDay([{ start: '22:00', end: '06:00' }])).toBe(8 * 60);
        expect(offPeakMinutesPerDay([{ start: '22:00', end: '06:00' }, { start: '03:00', end: '07:00' }])).toBe(9 * 60);
        expect(offPeakMinutesPerDay([])).toBe(0);
    });

    test("duration", () => {
        expect(formatDuration(480)).toBe('8 h');
        expect(formatDuration(450)).toBe('7 h 30');
        expect(formatDuration(65)).toBe('1 h 05');
    });

    test("saving only when off-peak is cheaper", () => {
        expect(offPeakSaving(0.2516, 0.1798)).toBe(29);
        expect(offPeakSaving(0.2, 0.2)).toBeNull();
        expect(offPeakSaving(0.2, null)).toBeNull();
        expect(offPeakSaving(0, 0)).toBeNull();
    });
});

describe("tariff status", () => {
    const tariffs = [flat('first', null), flat('second', '2027-02-01'), flat('third', '2027-06-01')];

    test("past, current and upcoming", () => {
        expect(tariffStatus(tariffs, 'first', '2027-03-15')).toBe('past');
        expect(tariffStatus(tariffs, 'second', '2027-03-15')).toBe('current');
        expect(tariffStatus(tariffs, 'third', '2027-03-15')).toBe('upcoming');
    });

    test("a tariff is current on its first and last day", () => {
        expect(tariffStatus(tariffs, 'second', '2027-02-01')).toBe('current');
        expect(tariffStatus(tariffs, 'second', '2027-05-31')).toBe('current');
        expect(tariffStatus(tariffs, 'first', '2027-01-31')).toBe('current');
    });
});

describe("peak hours", () => {
    test("the rest of the day", () => {
        expect(peakSlots([{ start: '22:00', end: '06:00' }])).toEqual([{ start: '06:00', end: '22:00' }]);
        expect(peakSlots([{ start: '22:00', end: '06:00' }, { start: '12:30', end: '14:00' }]))
            .toEqual([{ start: '06:00', end: '12:30' }, { start: '14:00', end: '22:00' }]);
    });

    test("a peak period over midnight is not split", () => {
        expect(peakSlots([{ start: '01:00', end: '05:00' }])).toEqual([{ start: '05:00', end: '01:00' }]);
        expect(peakSlots([{ start: '00:00', end: '06:00' }])).toEqual([{ start: '06:00', end: '00:00' }]);
    });

    test("none when off-peak covers the whole day", () => {
        expect(peakSlots([{ start: '00:00', end: '12:00' }, { start: '12:00', end: '00:00' }])).toEqual([]);
    });
});
