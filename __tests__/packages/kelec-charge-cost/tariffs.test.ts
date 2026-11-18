import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlatTariff, OffPeakSlot, Tariff } from "../../../src/packages/kelec-charge-cost/models/Tariff";
import { draftFromTariff, newDraft, parsePrice, tariffFromDraft } from "../../../src/packages/kelec-charge-cost/models/tariffDraft";
import { canDeleteTariff, deleteTariff, tariffEnd, tariffStatus, upsertTariff, withPeriod } from "../../../src/packages/kelec-charge-cost/services/tariffList";
import { TariffRepository } from "../../../src/packages/kelec-charge-cost/services/tariffRepository";
import { currencySymbol, formatKwhPrice, formatPrice, formatPricePerKwh } from "../../../src/packages/kelec-charge-cost/services/priceFormat";
import { daySchedules, formatDays, formatDuration, isSameEveryDay, offPeakMinutesPerDay, offPeakMinutesPerWeek, offPeakRanges, offPeakSaving, peakSlots } from "../../../src/packages/kelec-charge-cost/services/offPeakSummary";

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

    test("off-peak slots on different days", () => {
        const draft = { ...newDraft('a', [], new Date()), kind: 'peakOffPeak' as const, peakPrice: "0.27", offPeakPrice: "0.21" };
        const withSlots = (...offPeakSlots: OffPeakSlot[]) => tariffFromDraft({ ...draft, offPeakSlots });
        const overlap = { ok: false, errorKey: 'offPeakSlotsOverlap' };
        // mêmes heures, jours différents : acceptées
        expect(withSlots({ start: '22:00', end: '06:00', days: [1, 2, 3, 4, 5] }, { start: '20:00', end: '08:00', days: [6, 0] }).ok).toBe(true);
        // le vendredi soir déborde sur le samedi matin
        expect(withSlots({ start: '22:00', end: '06:00', days: [5] }, { start: '03:00', end: '07:00', days: [6] })).toEqual(overlap);
        expect(withSlots({ start: '22:00', end: '06:00', days: [5] }, { start: '06:00', end: '07:00', days: [6] }).ok).toBe(true);
        // du samedi soir au dimanche matin (fin de la semaine)
        expect(withSlots({ start: '22:00', end: '06:00', days: [6] }, { start: '01:00', end: '02:00', days: [0] })).toEqual(overlap);
        // une plage de tous les jours chevauche celle d'un seul jour
        expect(withSlots({ start: '22:00', end: '06:00' }, { start: '23:00', end: '01:00', days: [3] })).toEqual(overlap);
        // aucun jour : refusé
        expect(withSlots({ start: '22:00', end: '06:00', days: [] })).toEqual({ ok: false, errorKey: 'invalidOffPeakSlot' });
    });

    test("days are stored in the order of the week, and not at all for every day", () => {
        const draft = { ...newDraft('a', [], new Date()), kind: 'peakOffPeak' as const, peakPrice: "0.27", offPeakPrice: "0.21" };
        const saved = tariffFromDraft({ ...draft, offPeakSlots: [
            { start: '22:00', end: '06:00', days: [0, 3, 1] },
            { start: '12:00', end: '14:00', days: [0, 1, 2, 3, 4, 5, 6] },
        ] });
        expect(saved.ok && saved.value.kind === 'peakOffPeak' && saved.value.offPeakSlots).toEqual([
            { start: '22:00', end: '06:00', days: [1, 3, 0] },
            { start: '12:00', end: '14:00' },
        ]);
        expect(saved.ok && saved.value.kind === 'peakOffPeak' && 'days' in saved.value.offPeakSlots[1]).toBe(false);
    });

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

    const stored = async (key: string) => JSON.parse(await AsyncStorage.getItem(key) ?? 'null');

    test("nothing stored: no tariff, in euros", async () => {
        expect(await TariffRepository.get('vin1')).toEqual({ currency: 'EUR', tariffs: [] });
    });

    test("listeners get each saved version, with its car, until they unsubscribe", async () => {
        const listener = jest.fn();
        const unsubscribe = TariffRepository.subscribe(listener);
        await TariffRepository.save('vin1', { currency: 'EUR', tariffs: [flat('second', '2027-02-01'), flat('first', null)] });
        expect(listener).toHaveBeenCalledWith({
            vin: 'vin1',
            settings: { currency: 'EUR', tariffs: [flat('first', null), flat('second', '2027-02-01')] },
        });
        unsubscribe();
        await TariffRepository.save('vin1', { currency: 'EUR', tariffs: [] });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    test("tariffs are saved per car, sorted; the currency is shared by all cars", async () => {
        await AsyncStorage.setItem('electricityTariffsPerVehicle', 'true');
        await TariffRepository.save('vin1', { currency: 'NOK', tariffs: [flat('second', '2027-02-01'), flat('first', null)] });
        expect(await stored('vin1/electricityTariffs')).toEqual([flat('first', null), flat('second', '2027-02-01')]);
        expect(await stored('electricityTariffs')).toEqual({ currency: 'NOK' });

        expect(await TariffRepository.get('vin1')).toEqual({ currency: 'NOK', tariffs: [flat('first', null), flat('second', '2027-02-01')] });
        // une autre voiture : pas de tarif, mais la même devise
        expect(await TariffRepository.get('vin2')).toEqual({ currency: 'NOK', tariffs: [] });

        await TariffRepository.save('vin2', { currency: 'SEK', tariffs: [flat('other', null, 0.3)] });
        expect(await TariffRepository.get('vin1')).toEqual({ currency: 'SEK', tariffs: [flat('first', null), flat('second', '2027-02-01')] });
    });

    test("the former shared tariff is copied once to the cars already there", async () => {
        const legacy = { currency: 'CHF', tariffs: [flat('second', '2027-02-01'), flat('first', null)] };
        await AsyncStorage.setItem('electricityTariffs', JSON.stringify(legacy));
        await AsyncStorage.setItem('vin2/electricityTariffs', JSON.stringify([flat('own', null, 0.3)]));

        // avant la migration : l'ancien tarif commun s'applique
        expect(await TariffRepository.get('vin1')).toEqual({ currency: 'CHF', tariffs: [flat('first', null), flat('second', '2027-02-01')] });

        await TariffRepository.migrateToVehicles(['vin1', 'vin2']);
        expect(await stored('vin1/electricityTariffs')).toEqual([flat('first', null), flat('second', '2027-02-01')]);
        // une voiture qui a déjà ses tarifs les garde
        expect(await stored('vin2/electricityTariffs')).toEqual([flat('own', null, 0.3)]);
        // l'ancienne clé n'est pas effacée
        expect(await stored('electricityTariffs')).toEqual(legacy);

        // une voiture ajoutée ensuite démarre sans tarif, même si on relance la migration
        await TariffRepository.migrateToVehicles(['vin1', 'vin2', 'vin3']);
        expect(await TariffRepository.get('vin3')).toEqual({ currency: 'CHF', tariffs: [] });
        expect(await AsyncStorage.getItem('vin3/electricityTariffs')).toBeNull();
    });

    test("nothing to copy: the migration is still marked done", async () => {
        await TariffRepository.migrateToVehicles(['vin1']);
        expect(await AsyncStorage.getItem('electricityTariffsPerVehicle')).toBe('true');
        expect(await AsyncStorage.getItem('vin1/electricityTariffs')).toBeNull();
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

    test("days with the same slots are grouped, from Monday", () => {
        const nights: OffPeakSlot = { start: '22:00', end: '06:00', days: [1, 2, 3, 4, 5] };
        const noon: OffPeakSlot = { start: '12:00', end: '14:00', days: [3, 6] };
        expect(daySchedules([nights, noon])).toEqual([
            { days: [1, 2, 4, 5], slots: [nights] },
            { days: [3], slots: [nights, noon] },
            { days: [6], slots: [noon] },
            { days: [0], slots: [] },
        ]);
        expect(isSameEveryDay([nights, noon])).toBe(false);
        expect(isSameEveryDay([{ start: '22:00', end: '06:00' }])).toBe(true);
        expect(isSameEveryDay([])).toBe(true);
    });

    test("total per week", () => {
        expect(offPeakMinutesPerWeek([{ start: '22:00', end: '06:00' }])).toBe(7 * 8 * 60);
        expect(offPeakMinutesPerWeek([
            { start: '22:00', end: '06:00', days: [1, 2, 3, 4, 5] },
            { start: '00:00', end: '12:00', days: [6, 0] },
            { start: '12:00', end: '00:00', days: [6, 0] },
        ])).toBe(5 * 8 * 60 + 2 * 24 * 60);
    });

    test("days as text: three days in a row or more become a range", () => {
        const name = (day: number) => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day];
        expect(formatDays([1, 2, 3, 4, 5], name)).toBe('Mo – Fr');
        expect(formatDays([6, 0], name)).toBe('Sa, Su');
        expect(formatDays([0, 1, 3, 4, 5, 6], name)).toBe('Mo, We – Su');
        expect(formatDays([3], name)).toBe('We');
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
