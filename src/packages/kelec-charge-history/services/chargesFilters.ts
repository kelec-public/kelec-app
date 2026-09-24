import Charge from "../models/Charge";
import { Filter, FILTER_NO_MAX, FILTER_NO_MIN, FilterDate, FilterName, FilterNumerical, FilterSwitch } from "../models/Filter";

/* ------------------------------- APPLICATION ------------------------------ */

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const isInRange =(value: number, { min, max }: FilterNumerical): boolean => value >= min && value <= max;

const matchesFilter = (charge: Charge, filter: Filter): boolean => {
    switch (filter.filterName) {
        case FilterName.AVERAGE_POWER:
            return isInRange(charge.getAverageChargeSpeed(), filter.filterType as FilterNumerical);
        case FilterName.ENERGY_RECOVERED:
            return isInRange(charge.getEnergyRecovered(), filter.filterType as FilterNumerical);
        case FilterName.PERCENTAGE_RECOVERED:
            return isInRange(charge.getEndPercentage() - charge.getStartPercentage(), filter.filterType as FilterNumerical);
        case FilterName.DATE: {
            // Le sélecteur renvoie une date avec l'heure courante : on filtre sur des journées entières.
            const { startDate, endDate } = filter.filterType as FilterDate;
            const from = startDate ? startOfDay(startDate) : new Date(0);
            const to = endDate ? endOfDay(endDate) : new Date();
            const chargeDate = charge.getStartDate();
            return chargeDate >= from && chargeDate <= to;
        }
        case FilterName.ONLY_DC:
            return charge.isDCCharge();
        default:
            return true;
    }
};

export const applyFilters = (filters: Filter[], charges: Charge[]): Charge[] =>
    charges.filter(charge => filters.every(filter => matchesFilter(charge, filter)));

/* --------------------------------- ÉDITION -------------------------------- */

/** Ajoute le filtre, ou remplace celui qui a le même nom. */
export const upsertFilter = (filters: Filter[], filter: Filter): Filter[] => {
    const index = filters.findIndex(f => f.filterName === filter.filterName);
    if (index === -1) return [...filters, filter];

    const next = [...filters];
    next[index] = filter;
    return next;
};

export const removeFilter = (filters: Filter[], filterName: FilterName): Filter[] =>
    filters.filter(f => f.filterName !== filterName);

/* -------------------------------- LECTURE --------------------------------- */

const findFilter = (filterName: FilterName, filters: Filter[]): Filter | undefined =>
    filters.find(f => f.filterName === filterName);

export const getNumericalFilterValues = (filterName: FilterName, filters: Filter[]): { filterValueMin: number | undefined, filterValueMax: number | undefined } => {
    const filterType = findFilter(filterName, filters)?.filterType as FilterNumerical | undefined;
    return { filterValueMin: filterType?.min, filterValueMax: filterType?.max };
};

export const getDateFilterValues = (filterName: FilterName, filters: Filter[]): { filterValueMin: Date | undefined, filterValueMax: Date | undefined } => {
    const filterType = findFilter(filterName, filters)?.filterType as FilterDate | undefined;
    return { filterValueMin: filterType?.startDate, filterValueMax: filterType?.endDate };
};

export const getSwitchFilterValue = (filterName: FilterName, filters: Filter[]): boolean => {
    const filterType = findFilter(filterName, filters)?.filterType as FilterSwitch | undefined;
    return filterType?.isActive ?? false;
};

/* ------------------------------- AFFICHAGE -------------------------------- */

const formatFilterDate = (date: Date | undefined): string | undefined =>
    date?.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });

export const getFilterMin = (filter: Filter): number | string => {
    if (filter.filterName === FilterName.DATE) {
        return formatFilterDate((filter.filterType as FilterDate).startDate) || FILTER_NO_MIN;
    }
    return (filter.filterType as FilterNumerical).min;
};

export const getFilterMax = (filter: Filter): number | string => {
    if (filter.filterName === FilterName.DATE) {
        return formatFilterDate((filter.filterType as FilterDate).endDate) || FILTER_NO_MAX;
    }
    return (filter.filterType as FilterNumerical).max;
};

export const getFilterUnit = (filter: Filter): string => {
    if (filter.filterName === FilterName.DATE) return '';
    return (filter.filterType as FilterNumerical).unit;
};

/** Libellé d'un filtre actif, ex. "10kW < Puissance moyenne < 50kW". */
export const formatFilterLabel = (filter: Filter, translate: (key: string) => string): string => {
    if (filter.filterName === FilterName.ONLY_DC) {
        return translate("showOnlyDcCharges");
    }

    let label = "";
    if (getFilterMin(filter) !== FILTER_NO_MIN) {
        label += getFilterMin(filter) + getFilterUnit(filter) + " < ";
    }
    label += translate(filter.displayName);
    if (getFilterMax(filter) !== FILTER_NO_MAX) {
        label += " < " + getFilterMax(filter) + getFilterUnit(filter);
    }
    return label;
};
