import { getBlackColour } from "../../../lib/graphics/utils";
import { isMaxTemperature, isMinTemperature } from "../models/Temperature";

/** Bleu pour LOW, rouge pour HIGH ; sinon texte normal (ou gris en petit). */
export const getTemperatureColour = (temperature: number, isDarkMode: boolean, small: boolean = false): string => {
    if (isMinTemperature(temperature)) return 'blue';
    if (isMaxTemperature(temperature)) return 'red';
    return small ? 'gray' : getBlackColour(isDarkMode);
};

/** Les bornes (LOW / HIGH) s'affichent sans unité. */
export const showsDegreeUnit = (temperature: number): boolean =>
    !isMinTemperature(temperature) && !isMaxTemperature(temperature);
