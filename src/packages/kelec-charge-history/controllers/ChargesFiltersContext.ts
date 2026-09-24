import { createContext, useContext } from "react";
import { Filter, FilterName } from "../models/Filter";

export type ChargesFiltersController = {
    filters: Filter[];
    applyFilter: (filter: Filter) => void;
    removeFilter: (filterName: FilterName) => void;
};

/** Filtres actifs de l'historique, fournis par `useChargesHistoryController`. */
const ChargesFiltersContext = createContext<ChargesFiltersController>({
    filters: [],
    applyFilter: () => { },
    removeFilter: () => { },
});

export const useChargesFilters = (): ChargesFiltersController => useContext(ChargesFiltersContext);

export default ChargesFiltersContext;
