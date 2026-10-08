import { createDateParser, detectDateOrder } from "../../../src/packages/kelec-charge-import/services/dateFormat";

const local = (year: number, month: number, day: number, h: number, m: number, s: number) =>
    new Date(year, month - 1, day, h, m, s);

describe('detectDateOrder', () => {
    test('un jour > 12 en tête prouve un ordre jour-mois', () => {
        expect(detectDateOrder(['08/10/2026 14:05:09', '23/10/2026 10:00:00'], 'MDY')).toBe('DMY');
    });

    test('un nombre > 12 en deuxième position prouve un ordre mois-jour', () => {
        expect(detectDateOrder(['10/8/2026, 2:05:09 PM', '10/23/2026, 9:00:00 AM'], 'DMY')).toBe('MDY');
    });

    test("sans preuve, garde l'ordre de l'appareil", () => {
        expect(detectDateOrder(['08/10/2026 14:05:09', '01/02/2026 10:00:00'], 'MDY')).toBe('MDY');
        expect(detectDateOrder(['08/10/2026 14:05:09'], 'DMY')).toBe('DMY');
    });

    test('ignore les dates ISO et celles qui commencent par l\'année', () => {
        expect(detectDateOrder(['2024-08-23T07:57:41Z', '2026-10-23 14:05:09'], 'MDY')).toBe('MDY');
    });
});

describe('createDateParser', () => {
    test('lit les dates ISO de l\'API (anciens exports)', () => {
        const parse = createDateParser(['2024-08-23T07:57:41Z'], 'DMY');
        expect(parse('2024-08-23T07:57:41Z')).toEqual(new Date('2024-08-23T07:57:41Z'));
        expect(parse('2024-08-23T07:57:41.000Z')).toEqual(new Date('2024-08-23T07:57:41Z'));
    });

    test.each([
        ['fr', '23/10/2026 14:05:09'],
        ['en-GB', '23/10/2026, 14:05:09'],
        ['de', '23.10.2026, 14:05:09'],
        ['fi', '23.10.2026 klo 14.05.09'],
        ['cs', '23. 10. 2026 14:05:09'],
        ['hr', '23. 10. 2026. 14:05:09'],
        ['bg', '23.10.2026 г., 14:05:09 ч.'],
        ['nl', '23-10-2026, 14:05:09'],
        ['en-US', '10/23/2026, 2:05:09 PM'],
        ['en-US (narrow no-break space)', '10/23/2026, 2:05:09 PM'],
        ['sv', '2026-10-23 14:05:09'],
        ['hu', '2026. 10. 23. 14:05:09'],
        ['ja', '2026/10/23 14:05:09'],
        ['ko', '2026. 10. 23. PM 2:05:09'],
        ['en-CA', '2026-10-23, 2:05:09 p.m.'],
        ['fr-CA', '2026-10-23 14 h 05 min 09 s'],
        ['el', '23/10/2026, 2:05:09 μ.μ.'],
    ])('lit le format local %s', (_locale, text) => {
        const parse = createDateParser([text], 'DMY');
        expect(parse(text)).toEqual(local(2026, 10, 23, 14, 5, 9));
    });

    test("l'ordre détecté sur une date s'applique aux autres dates du fichier", () => {
        const parse = createDateParser(['10/23/2026, 2:05:09 PM', '10/8/2026, 9:00:00 AM'], 'DMY');
        expect(parse('10/8/2026, 9:00:00 AM')).toEqual(local(2026, 10, 8, 9, 0, 0));
    });

    test('minuit et midi en format 12 h', () => {
        const parse = createDateParser([], 'MDY');
        expect(parse('10/8/2026, 12:30:00 AM')).toEqual(local(2026, 10, 8, 0, 30, 0));
        expect(parse('10/8/2026, 12:30:00 PM')).toEqual(local(2026, 10, 8, 12, 30, 0));
    });

    test('accepte une cellule au format date (fichier enregistré dans un tableur)', () => {
        const date = local(2026, 10, 8, 14, 5, 9);
        expect(createDateParser([], 'DMY')(date)).toBe(date);
    });

    test('refuse les valeurs illisibles ou incohérentes', () => {
        const parse = createDateParser([], 'DMY');
        expect(parse(undefined)).toBeNull();
        expect(parse('')).toBeNull();
        expect(parse(45000)).toBeNull();
        expect(parse('pas une date')).toBeNull();
        expect(parse('31/02/2026 10:00:00')).toBeNull();
        expect(parse('08/10/2026 25:00:00')).toBeNull();
        expect(parse('8/10/2569 14:05:09')).toBeNull(); // calendrier bouddhiste (th)
        expect(parse(new Date('invalid'))).toBeNull();
    });
});
