import { useCallback, useContext, useMemo, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import CarsViewContext from "../../../lib/Contexts/CarsViewContext";
import ChargesHistory from "../models/ChargesHistory";
import { Filter, FilterName } from "../models/Filter";
import { applyFilters, removeFilter as withoutFilter, upsertFilter } from "../services/chargesFilters";
import { buildChargeMonths, countMonths, sortByStartDate } from "../services/chargeMonths";
import { exportCharges } from "../services/chargesExport";
import { ChargesFiltersController } from "./ChargesFiltersContext";

/** Nombre de mois affichés à l'ouverture et après un changement de tri. */
const INITIAL_MONTHS = 2;

/**
 * État et actions de l'écran d'historique : filtres, tri, pagination par mois,
 * feuilles modales et export.
 */
export function useChargesHistoryController(history: ChargesHistory) {
    const { appPreferences } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);

    const [sortDesc, setSortDesc] = useState(true);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [displayedMonths, setDisplayedMonths] = useState(INITIAL_MONTHS);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    /* ---------------------------------- DATA ---------------------------------- */

    const months = useMemo(
        () => buildChargeMonths(history.getCharges(), filters, {
            merge: appPreferences.mergeCharges,
            sortDesc,
            monthLimit: displayedMonths,
        }),
        [history, filters, sortDesc, displayedMonths, appPreferences.mergeCharges],
    );

    const hasMoreMonths = useMemo(
        () => displayedMonths < countMonths(history.getCharges(), filters),
        [history, filters, displayedMonths],
    );

    /* --------------------------------- FILTRES -------------------------------- */

    const applyFilter = useCallback((filter: Filter) => {
        setFilters(current => upsertFilter(current, filter));
    }, []);

    const removeFilter = useCallback((filterName: FilterName) => {
        setFilters(current => withoutFilter(current, filterName));
    }, []);

    const filtersController = useMemo<ChargesFiltersController>(
        () => ({ filters, applyFilter, removeFilter }),
        [filters, applyFilter, removeFilter],
    );

    /* ------------------------------ LISTE & TRI ------------------------------- */

    const loadMoreMonths = useCallback(() => {
        setDisplayedMonths(count => count + 1);
    }, []);

    const toggleSort = useCallback(() => {
        setSortDesc(desc => !desc);
        setDisplayedMonths(INITIAL_MONTHS);
    }, []);

    const exportFilteredCharges = useCallback(async () => {
        const toExport = sortByStartDate(applyFilters(filters, history.getCharges()), sortDesc);
        await exportCharges(toExport);
    }, [history, filters, sortDesc]);

    /* --------------------------------- MODALES -------------------------------- */

    const openOptions = useCallback(() => {
        setIsOptionsOpen(true);
        handleModalAnim(true);
    }, [handleModalAnim]);

    const closeOptions = useCallback(() => {
        setIsOptionsOpen(false);
        handleModalAnim(false);
    }, [handleModalAnim]);

    const openFilters = useCallback(() => {
        setIsFiltersOpen(true);
        handleModalAnim(true);
    }, [handleModalAnim]);

    const closeFilters = useCallback(() => {
        setIsFiltersOpen(false);
        handleModalAnim(false);
    }, [handleModalAnim]);

    return {
        months,
        hasMoreMonths,
        sortDesc,
        filtersController,
        isOptionsOpen,
        isFiltersOpen,
        loadMoreMonths,
        toggleSort,
        exportFilteredCharges,
        openOptions,
        closeOptions,
        openFilters,
        closeFilters,
    };
}
