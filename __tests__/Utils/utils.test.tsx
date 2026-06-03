import { CarMaker } from "../../src/lib/clients/accounts/account";
import {
    getBlackColour,
    getBlackGrayBackgroundColour,
    getWhiteColour, getGrayBackgroundColour,
    getGrayColour,
    getBlueText,
    getDisplayDate,
    getLightGray,
    coloursAssets,
    formatPlate,
    formatNumberWithLeadingZero,
    getCarMakerLogo,
    getAccentOrange,
    getGrayWhiteBackgroundColour,
    getChargingBarColour
} from "../../src/lib/graphics/utils";

import { it, describe, expect } from '@jest/globals';

describe('getBlackColour', () => {
    it('should return white when isDarkMode is true', () => {
        expect(getBlackColour(true)).toBe('white');
    });
    it('should return black when isDarkMode is false', () => {
        expect(getBlackColour(false)).toBe('black');
    });
});

describe('getBlackGrayBackgroundColour', () => {
    it('should return grey when isDarkMode is true', () => {
        expect(getBlackGrayBackgroundColour(true)).toBe('rgb(28,28,28)');
    });
    it('should return black when isDarkMode is false', () => {
        expect(getBlackGrayBackgroundColour(false)).toBe('black');
    });
});

describe('getWhiteColour', () => {
    it('should return black when isDarkMode is true', () => {
        expect(getWhiteColour(true)).toBe('black');
    });
    it('should return white when isDarkMode is false', () => {
        expect(getWhiteColour(false)).toBe('white');
    });
});

describe('getGrayBackgroundColour', () => {
    it('should return grey when isDarkMode is true', () => {
        expect(getGrayBackgroundColour(true)).toBe('rgb(28,28,28)');
    });
    it('should return white when isDarkMode is false', () => {
        expect(getGrayBackgroundColour(false)).toBe('white');
    });
});

describe('getGrayColour', () => {
    it('should return white when isDarkMode is true', () => {
        expect(getGrayColour(true)).toBe('white');
    });
    it('should return gray when isDarkMode is false', () => {
        expect(getGrayColour(false)).toBe('gray');
    });
});

describe('getBlueText', () => {
    it('should return lightblue when isDarkMode is true', () => {
        expect(getBlueText(true)).toBe('lightblue');
    });
    it('should return blue when isDarkMode is false', () => {
        expect(getBlueText(false)).toBe('blue');
    });
});

describe('getLightGray', () => {
    it('should return grey when isDarkMode is true', () => {
        expect(getLightGray(true)).toBe(coloursAssets.greyBackground);
    });
    it('should return lightgray when isDarkMode is false', () => {
        expect(getLightGray(false)).toBe('lightgray');
    });
});

describe('getGrayWhiteBackgroundColour', () => {
    it('should return grey background when isDarkMode is true', () => {
        expect(getGrayWhiteBackgroundColour(true)).toBe(coloursAssets.greyBackground);
    });
    it('should return white when isDarkMode is false', () => {
        expect(getGrayWhiteBackgroundColour(false)).toBe('rgb(240,241,243)');
    });
});

describe('formatPlate', () => {
    it('should format the plate correctly', () => {
        expect(formatPlate('AA000AA')).toBe('AA-000-AA');
    });

    it('should be empty', () => {
        expect(formatPlate()).toBe('');
    });
});



describe('getDisplayDate', () => {
    it('formatDate today with leading 0', () => {
        const dateToday = new Date();
        dateToday.setHours(8);
        dateToday.setMinutes(30);
        const dateFormatted = getDisplayDate(dateToday);
        expect(dateFormatted).toBe('08:30');
    });


    it('formatDate today without leading 0', () => {
        const dateToday = new Date();
        dateToday.setHours(18);
        dateToday.setMinutes(5);
        const dateFormatted = getDisplayDate(dateToday);
        expect(dateFormatted).toBe('18:05');
    });

    it('formatDate yesterday', () => {
        let dateYesterday = new Date();
        dateYesterday.setDate(dateYesterday.getDate() - 1);
        dateYesterday.setHours(23);
        dateYesterday.setMinutes(59);
        dateYesterday.setSeconds(59);
        let dateFormatted = getDisplayDate(dateYesterday);
        expect(dateFormatted).toBe('hier à 23:59');
    });

    it('format date before yesterday', () => {
        let dateBeforeYesterday = new Date();
        dateBeforeYesterday.setDate(dateBeforeYesterday.getDate() - 2);
        dateBeforeYesterday.setHours(23);
        dateBeforeYesterday.setMinutes(59);
        dateBeforeYesterday.setSeconds(59);
        let dateFormatted = getDisplayDate(dateBeforeYesterday);
        let day = dateBeforeYesterday.getDate();
        let month = dateBeforeYesterday.getMonth() + 1;
        let year = dateBeforeYesterday.getFullYear();
        const dayStr = day < 10 ? '0' + day : day;
        const monthSre = month < 10 ? '0' + month : month;
        let strDate = dayStr + '/' + monthSre + '/' + year;
        expect(dateFormatted).toBe(' le ' + strDate + ' à 23:59');
    });

    it('format date before yesterday leading 0', () => {
        let dateBeforeYesterday = new Date("2021-01-01T00:00:00Z");
        dateBeforeYesterday.setDate(dateBeforeYesterday.getDate() - 2);
        dateBeforeYesterday.setHours(8);
        dateBeforeYesterday.setMinutes(9);
        let dateFormatted = getDisplayDate(dateBeforeYesterday);
        expect(dateFormatted).toBe(' le 30/12/2020 à 08:09');
    });
});

describe('formatNumberWithLeadingZero', () => {
    it('should return 01', () => {
        expect(formatNumberWithLeadingZero(1)).toBe('01');
    });

    it('should return 10', () => {
        expect(formatNumberWithLeadingZero(10)).toBe('10');
    });
});

describe('getCarMakerLogo', () => {
    it('should return renault black', () => {
        expect(getCarMakerLogo(CarMaker.RENAULT, false).testUri).toContain('renault_black');
    });

    it('should return renault white', () => {
        expect(getCarMakerLogo(CarMaker.RENAULT, true).testUri).toContain('renault_white');
    });

    it('should return hyundai black', () => {
        expect(getCarMakerLogo(CarMaker.HYUNDAI, false).testUri).toContain('hyundai_black');
    });

    it('should return hyundai white', () => {
        expect(getCarMakerLogo(CarMaker.HYUNDAI, true).testUri).toContain('hyundai_white');
    });

    it('should return dacia black', () => {
        expect(getCarMakerLogo(CarMaker.DACIA, false).testUri).toContain('dacia_black');
    });

    it('should return dacia white', () => {
        expect(getCarMakerLogo(CarMaker.DACIA, true).testUri).toContain('dacia_white');
    });
});

describe('get orange accent colour', () => {
    it('should return full opacity', () => {
        expect(getAccentOrange()).toBe('rgb(215, 90, 40)');
    });

    it('should return 50% opacity', () => {
        expect(getAccentOrange(0.5)).toBe('rgba(215, 90, 40, 0.5)');
    });
});

describe('get charging bar colour', () => {
    it('should return green bar for non v2g', () => {
        expect(getChargingBarColour(false, 0.5)).toBe('rgba(39,205,65,0.5)');
    });
    it('should return orange bar for v2g', () => {
        expect(getChargingBarColour(true)).toBe('rgba(255,165,0,1)');
    });
});