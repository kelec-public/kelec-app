/** Températures de consigne proposées (°C). Les bornes s'affichent LOW / HIGH. */
export const TEMPERATURES = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

export const MIN_TEMPERATURE = TEMPERATURES[0];
export const MAX_TEMPERATURE = TEMPERATURES[TEMPERATURES.length - 1];
export const DEFAULT_TEMPERATURE = 21;

export const isMinTemperature = (temperature: number): boolean => temperature === MIN_TEMPERATURE;

export const isMaxTemperature = (temperature: number): boolean => temperature === MAX_TEMPERATURE;

export const getTemperatureLabel = (temperature: number): string => {
    if (isMinTemperature(temperature)) return 'LOW';
    if (isMaxTemperature(temperature)) return 'HIGH';
    return temperature.toString();
};

/** Température voisine dans la liste, ou la même si on est déjà à une borne. */
export const stepTemperature = (temperature: number, direction: -1 | 1): number => {
    const index = TEMPERATURES.indexOf(temperature);
    const next = TEMPERATURES[index + direction];
    return next ?? temperature;
};
