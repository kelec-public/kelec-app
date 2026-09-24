export enum FilterUnit {
    KWH = 'kWh',
    PERCENTAGE = '%',
    KW = 'kW'
}

export enum FilterName {
    AVERAGE_POWER = 'averagePower',
    ENERGY_RECOVERED = 'energyRecovered',
    PERCENTAGE_RECOVERED = 'percentageRecovered',
    DATE = 'date',
    ONLY_DC = 'showOnlyDcCharges',
}

export type FilterNumerical = {
    readonly min: number;
    readonly max: number;
    readonly unit: FilterUnit;
}

export type FilterDate = {
    readonly startDate: Date | undefined;
    readonly endDate: Date | undefined;
}

export type FilterSwitch = {
    readonly isActive: boolean;
}

export type Filter = {
    readonly displayName: string;
    readonly filterName: FilterName;
    readonly filterType: FilterNumerical | FilterDate | FilterSwitch
}

/** Valeurs "non bornées" utilisées par les champs numériques. */
export const FILTER_NO_MIN = 0;
export const FILTER_NO_MAX = 9999;

export const getFiltersAvailable = (): Filter[] => [
    {
        displayName: 'averagePower',
        filterName: FilterName.AVERAGE_POWER,
        filterType: { min: 0, max: 300, unit: FilterUnit.KW },
    },
    {
        displayName: 'addedKWH',
        filterName: FilterName.ENERGY_RECOVERED,
        filterType: { min: 0, max: 100, unit: FilterUnit.KWH },
    },
    {
        displayName: 'addedPercentage',
        filterName: FilterName.PERCENTAGE_RECOVERED,
        filterType: { min: 0, max: 100, unit: FilterUnit.PERCENTAGE },
    },
    {
        displayName: 'date',
        filterName: FilterName.DATE,
        filterType: { startDate: new Date(), endDate: new Date() },
    },
    {
        displayName: 'showOnlyDcCharges',
        filterName: FilterName.ONLY_DC,
        filterType: { isActive: false },
    },
];
