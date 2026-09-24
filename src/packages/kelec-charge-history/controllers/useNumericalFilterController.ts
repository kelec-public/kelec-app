import { useState } from "react";
import { Filter, FILTER_NO_MAX, FILTER_NO_MIN, FilterNumerical } from "../models/Filter";
import { useChargesFilters } from "./ChargesFiltersContext";

/** Garde uniquement les chiffres ; au-delà de FILTER_NO_MAX, ramène juste en dessous. */
const sanitize = (text: string): string => {
    const digits = text.replace(/\D/g, '');
    return parseInt(digits) > FILTER_NO_MAX ? String(FILTER_NO_MAX - 1) : digits;
};

const toInput = (value: number | undefined, unbounded: number): string =>
    value === undefined || value === unbounded ? "" : String(value);

/** État des deux champs min / max d'un filtre numérique, synchronisé avec les filtres actifs. */
export function useNumericalFilterController(filter: Filter, initialMin?: number, initialMax?: number) {
    const { applyFilter, removeFilter } = useChargesFilters();
    const { unit } = filter.filterType as FilterNumerical;

    const [minValue, setMinValue] = useState(() => toInput(initialMin, FILTER_NO_MIN));
    const [maxValue, setMaxValue] = useState(() => toInput(initialMax, FILTER_NO_MAX));

    const update = (min: string, max: string) => {
        setMinValue(min);
        setMaxValue(max);

        if (min === "" && max === "") {
            removeFilter(filter.filterName);
            return;
        }
        applyFilter({
            displayName: filter.displayName,
            filterName: filter.filterName,
            filterType: {
                min: min !== "" ? parseInt(min) : FILTER_NO_MIN,
                max: max !== "" ? parseInt(max) : FILTER_NO_MAX,
                unit,
            },
        });
    };

    return {
        minValue,
        maxValue,
        onMinChange: (text: string) => update(sanitize(text), maxValue),
        onMaxChange: (text: string) => update(minValue, sanitize(text)),
    };
}
