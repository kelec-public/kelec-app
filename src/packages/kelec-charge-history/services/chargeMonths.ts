import Charge from "../models/Charge";
import { ChargeMonth, ChargeMonthDay } from "../models/ChargeMonth";
import { Filter } from "../models/Filter";
import { applyFilters } from "./chargesFilters";

const monthKey = (date: Date): string => date.getMonth() + "-" + date.getFullYear();

export const sortByStartDate = (charges: Charge[], sortDesc: boolean): Charge[] =>
    [...charges].sort((a, b) => sortDesc
        ? b.getStartDate().getTime() - a.getStartDate().getTime()
        : a.getStartDate().getTime() - b.getStartDate().getTime());

/**
 * Fusionne les charges consécutives où le niveau de fin de l'une est le niveau de début de la suivante.
 * `charges` doit être trié par date croissante.
 */
export const mergeCharges = (charges: Charge[]): Charge[] => {
    const merged: Charge[] = [];
    let i = 0;
    while (i < charges.length) {
        let current = charges[i];
        let j = i + 1;
        while (
            j < charges.length &&
            current.chargeEndBatteryLevel === charges[j].chargeStartBatteryLevel &&
            current.isV2G === charges[j].isV2G
        ) {
            const next = charges[j];
            const subCharges = current.getSubCharges().length !== 0
                ? [...current.getSubCharges(), next]
                : [current, next];

            current = new Charge(
                current.chargeStartDate,
                next.chargeEndDate,
                current.getDurationInMinutes() + next.getDurationInMinutes(),
                current.chargeStartBatteryLevel,
                next.chargeEndBatteryLevel,
                current.getEnergyRecovered() + next.getEnergyRecovered(),
                next.chargeEndStatus,
                true,
                subCharges,
                current.mileageAtStart,
                current.inaccurateMileage && next.inaccurateMileage,
                current.getV2GEnergyDischarged() + next.getV2GEnergyDischarged(),
                current.isV2G || next.isV2G,
            );
            j++;
        }
        merged.push(current);
        i = j;
    }
    return merged;
};

/** Nombre de mois distincts contenant au moins une charge après filtrage. */
export const countMonths = (charges: Charge[], filters: Filter[]): number =>
    new Set(applyFilters(filters, charges).map(charge => monthKey(charge.getStartDate()))).size;

type BuildOptions = {
    merge: boolean;
    sortDesc?: boolean;
    monthLimit?: number; // nombre de mois à construire (pagination)
};

/** Filtre, fusionne si demandé, trie puis regroupe les charges par mois. */
export const buildChargeMonths = (
    charges: Charge[],
    filters: Filter[],
    { merge, sortDesc = true, monthLimit = 2 }: BuildOptions,
): ChargeMonth[] => {
    let selected = applyFilters(filters, charges);
    if (merge) selected = mergeCharges(selected);
    selected = sortByStartDate(selected, sortDesc);

    // Les charges étant triées, les mois sortent déjà dans le bon ordre.
    const months: ChargeMonth[] = [];
    const minutesByMonth: number[] = [];
    for (const charge of selected) {
        const date = charge.getStartDate();
        const key = monthKey(date);

        let month = months[months.length - 1];
        if (month?.monthYear !== key) {
            if (months.length === monthLimit) break;
            month = {
                monthYear: key,
                monthNumber: date.getMonth(),
                year: date.getFullYear(),
                charges: [],
                totalTimeCharged: [0, 0],
                totalEnergyRecovered: 0,
            };
            months.push(month);
            minutesByMonth.push(0);
        }

        month.charges.push(charge);
        month.totalEnergyRecovered += charge.getEnergyRecovered();
        minutesByMonth[months.length - 1] += charge.getDurationInMinutes();
    }

    months.forEach((month, index) => {
        const minutes = minutesByMonth[index];
        month.totalEnergyRecovered = parseFloat(month.totalEnergyRecovered.toFixed(2));
        month.totalTimeCharged = [Math.floor(minutes / 60), Math.floor(minutes % 60)];
    });
    return months;
};

/** Un élément par jour du mois, pour le mini-graphique d'en-tête. */
export const getMonthDays = (month: ChargeMonth, now: Date = new Date()): ChargeMonthDay[] => {
    const daysInMonth = new Date(month.year, month.monthNumber + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const chargesOfDay = month.charges.filter(charge => charge.getStartDate().getDate() === day);
        return {
            day,
            hasCharge: chargesOfDay.length > 0,
            hasDCCharge: chargesOfDay.some(charge => charge.isDCCharge()),
            isFuture: new Date(month.year, month.monthNumber, day).getTime() > now.getTime(),
        };
    });
};
