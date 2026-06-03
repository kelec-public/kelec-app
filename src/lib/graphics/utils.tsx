import AppPreferences from "../appPreferences/model/appPreferences";
import { CarMaker } from "../clients/accounts/account";
import LanguageHandler from "../model/localization/languageHandler";
import { Palette } from '../../../theme/_palette';

const coloursAssets = {
    greyBackground: Palette.gray_200,
}


const getGrayBackgroundColour = (isDarkMode: boolean) => {
    return isDarkMode ? coloursAssets.greyBackground : 'white';
}

const getGrayColour = (isDarkMode: boolean) => {
    return isDarkMode ? 'white' : 'gray';
}

const getWhiteColour = (isDarkMode: boolean) => {
    return isDarkMode ? 'black' : 'white';
}

const getBlackColour = (isDarkMode: boolean) => {
    return isDarkMode ? 'white' : 'black';
}

const getBlueText = (isDarkMode: boolean) => {
    return isDarkMode ? 'lightblue' : 'blue';
}

const getLightGray = (isDarkMode: boolean) => {
    return isDarkMode ? coloursAssets.greyBackground : 'lightgray';
}
const getTopDarkColour = (isDarkMode: boolean) => {
    return isDarkMode ? 'black' : 'rgb(240,241,243)';
}

const capitlizeFirstLetter = (word: string): string => {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

const formatPlate = (plate: string = "") => {
    // to format a plate in a french format ex : AA000AA => AA-000-AA
    let formattedPlate = "";
    for (let i = 0; i < plate.length; i++) {
        if (i == 2 || i == 5) {
            formattedPlate += "-";
        }
        formattedPlate += plate[i];
    }
    return formattedPlate;
}

const getDisplayDate = (date: Date) => {
    // return only the hours if it's today, else return the date
    const languageHandler = new LanguageHandler();
    const today = new Date();
    const minutes = formatNumberWithLeadingZero(date.getMinutes());
    const hours = formatNumberWithLeadingZero(date.getHours());
    if (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()) {
        return hours + ":" + minutes;
    }
    // if the day is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return languageHandler.getTranslation("yesterdayAt") + hours + ":" + minutes;
    }

    // else
    let day = date.getDate();
    let month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayStr = formatNumberWithLeadingZero(day);
    const monthStr = formatNumberWithLeadingZero(month);
    const strDate = dayStr + '/' + monthStr + '/' + year;
    return languageHandler.getTranslation("the")
        + strDate + languageHandler.getTranslation("at")
        + hours + ':' + minutes;
}

const formatNumberWithLeadingZero = (number: number): string => {
    if (number < 10) {
        return "0" + number;
    } else {
        return number.toString();
    }
}

const formatNumberWithSpaces = (number: number): string => {
    // format a number with spaces. Ex 3035.10 => 3 035 
    number = Math.round(number);
    const str = number.toString();
    let newStr = "";
    for (let i = 0; i < str.length; i++) {
        if (i % 3 == 0 && i != 0) {
            newStr = " " + newStr;
        }
        newStr = str[str.length - i - 1] + newStr;
    }
    return newStr;
}

const convertDateForChargeHistory = (date: Date, fullSize: boolean): string => {
    const languageHandler = new LanguageHandler();
    const months = ['Janvier_short',
        'Février_short', 'Mars_short',
        'Avril_short', 'Mai_short',
        'Juin_short', 'Juillet_short',
        'Août_short', 'Septembre_short',
        'Octobre_short', 'Novembre_short',
        'Décembre_short'];
    const d = new Date(date);
    const month = months[d.getMonth()];
    if (fullSize) {
        return d.getDate() + ' ' +
            languageHandler.getTranslation(month) + ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return d.getDate() + ' ' + languageHandler.getTranslation(month);
    }
};

const convertHoursForChargeHistory = (startDate: Date, endDate: Date) => {
    return startDate.toLocaleTimeString([],
        { hour: '2-digit', minute: '2-digit' }) + ' -> '
        + endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getCarMakerLogo = (brand: CarMaker, isDarkMode: boolean): any => {
    // this method returns the logo of the car maker according to the theme
    switch (brand) {
        case CarMaker.RENAULT:
            return isDarkMode ? require('../../assets/logos/car_makers/renault_white.png') : require('../../assets/logos/car_makers/renault_black.png');
        case CarMaker.HYUNDAI:
            return isDarkMode ? require('../../assets/logos/car_makers/hyundai_white.png') : require('../../assets/logos/car_makers/hyundai_black.png');
        case CarMaker.DACIA:
            return isDarkMode ? require('../../assets/logos/car_makers/dacia_white.png') : require('../../assets/logos/car_makers/dacia_black.png');
        case CarMaker.ALPINE:
            return isDarkMode ? require('../../assets/logos/car_makers/alpine_white.png') : require('../../assets/logos/car_makers/alpine_black.png');
    }
}

const getDistance = (distance: number, appPreferences: AppPreferences, forced = false): number => {
    let range = distance;
    if ((forced && appPreferences.convertToMiles) || (!forced && appPreferences.displayMiles)) { // this value should be converted only if the user wants it
        range = range * 0.621371;
        range = Math.round(range);
    }
    return range
}

const getAccentOrange = (opacity?: number) => {
    if (!opacity) {
        return 'rgb(215, 90, 40)';
    }
    return `rgba(215, 90, 40, ${opacity})`;
}

const getChargingBarColour = (isV2G: boolean, opacity: number = 1) => {
    return isV2G ? `rgba(255,165,0,${opacity})` : `rgba(39,205,65,${opacity})`;
}

export {
    getBlackColour,
    getWhiteColour,
    getGrayBackgroundColour,
    getGrayColour,
    coloursAssets,
    formatPlate,
    getBlueText,
    getDisplayDate,
    getLightGray,
    formatNumberWithLeadingZero,
    getTopDarkColour,
    convertDateForChargeHistory,
    convertHoursForChargeHistory,
    capitlizeFirstLetter,
    getCarMakerLogo,
    getAccentOrange,
    formatNumberWithSpaces,
    getDistance,
    getChargingBarColour
};