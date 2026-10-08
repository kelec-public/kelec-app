import { describe, expect, it } from '@jest/globals';
import { formatLicencePlate } from "../../../src/packages/kelec-licence-plate";

describe('formatLicencePlate', () => {
    it.each([
        ['FR', 'FJ717PW', 'FJ-717-PW'],
        ['IT', 'AB123CD', 'AB 123 CD'],
        ['ES', '1234BCD', '1234 BCD'],
        ['PT', 'AB12CD', 'AB-12-CD'],
        ['PT', '12AB34', '12-AB-34'],
        ['BE', '1ABC234', '1-ABC-234'],
        ['BE', 'ABC123', 'ABC-123'],
        ['LU', 'AB1234', 'AB 1234'],
        ['NL', 'AB1234', 'AB-12-34'],
        ['NL', 'ABCD12', 'AB-CD-12'],
        ['NL', '1ABC23', '1-ABC-23'],
        ['NL', 'GBX12F', 'GBX-12-F'],
        ['NL', '12ABC3', '12-ABC-3'],
        ['CZ', '1AB2345', '1AB 2345'],
        ['DK', 'AB12345', 'AB 12 345'],
        ['SE', 'ABC12D', 'ABC 12D'],
        ['SE', 'ABC123', 'ABC 123'],
        ['FI', 'ABC123', 'ABC-123'],
        ['EE', '123ABC', '123 ABC'],
        ['LV', 'AB1234', 'AB-1234'],
        ['LT', 'ABC123', 'ABC 123'],
        ['MT', 'ABC123', 'ABC 123'],
        ['CY', 'ABC123', 'ABC 123'],
        ['GR', 'ABC1234', 'ABC-1234'],
        ['HU', 'AABC123', 'AA BC-123'],
        ['HU', 'ABC123', 'ABC-123'],
        ['RO', 'AB12CDE', 'AB 12 CDE'],
        ['RO', 'B123CDE', 'B 123 CDE'],
        ['BG', 'CA1234AB', 'CA 1234 AB'],
        ['HR', 'ZG1234AB', 'ZG 1234-AB'],
        ['HR', 'ČK123A', 'ČK 123-A'],
        ['IE', '191D12345', '191-D-12345'],
        ['GB', 'BD17ORZ', 'BD17 ORZ'],
    ])('%s : %s → %s', (country, plate, expected) => {
        expect(formatLicencePlate(plate, country)).toBe(expected);
    });

    it('accepte une plaque déjà formatée ou en minuscules', () => {
        expect(formatLicencePlate('fj-717-pw', 'FR')).toBe('FJ-717-PW');
        expect(formatLicencePlate('AB 123 CD', 'fr')).toBe('AB-123-CD');
    });

    it('renvoie la plaque brute sans pays', () => {
        expect(formatLicencePlate('AA001AA')).toBe('AA001AA');
    });

    it('renvoie la plaque brute pour un pays non géré', () => {
        expect(formatLicencePlate('MAB1234', 'DE')).toBe('MAB1234');
        expect(formatLicencePlate('WI12345', 'PL')).toBe('WI12345');
        expect(formatLicencePlate('34ABC123', 'TR')).toBe('34ABC123');
    });

    it('renvoie la plaque brute si elle ne correspond à aucun format du pays', () => {
        expect(formatLicencePlate('1234AB75', 'FR')).toBe('1234AB75');
        expect(formatLicencePlate('ABCDEF', 'NL')).toBe('ABCDEF');
        expect(formatLicencePlate('', 'FR')).toBe('');
    });
});
