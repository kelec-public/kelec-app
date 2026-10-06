import * as sharedPlatformsData from "../../../src/lib/storage/sharedPlatformsData";
import { formatMileageEntry, lastMileageEntries } from "../../../src/packages/kelec-settings/services/mileageHistoryDebug";

const entry = (mileage: number) => ({ mileage, timestamp: new Date(2026, 9, 6, 12, mileage).toISOString() });

afterEach(() => jest.restoreAllMocks());

test('lastMileageEntries : les 10 dernières entrées, dans l\'ordre', async () => {
    const history = Array.from({ length: 15 }, (_, i) => entry(i));
    jest.spyOn(sharedPlatformsData, 'getMileageHistory').mockResolvedValue(history);

    const last = await lastMileageEntries('VIN');

    expect(last.map(e => e.mileage)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
});

test('lastMileageEntries : liste vide sans historique', async () => {
    jest.spyOn(sharedPlatformsData, 'getMileageHistory').mockResolvedValue(null);

    expect(await lastMileageEntries('VIN')).toEqual([]);
});

test('formatMileageEntry : date locale et kilométrage', () => {
    const e = entry(3);
    expect(formatMileageEntry(e)).toBe(`${new Date(e.timestamp).toLocaleString()} : 3 km`);
});
