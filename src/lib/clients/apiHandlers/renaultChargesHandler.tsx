import AppPreferences from "../../appPreferences/model/appPreferences";
import { formatNumberWithLeadingZero } from "../../graphics/utils";
import { Filter, FilterDate, FilterName, FilterNumerical } from "../../model/filters/FiltersStruct";
import RenaultCharge from "./renaultCharges/RenaultCharge";

type ChargeIndex = {
    monthYear: string;
    monthNumber: number;
    year: number;
    charges: RenaultCharge[];
    totalTimeCharged: number[];
    totalEnergyRecovered: number;
};


interface RenaultChargesHandler {
    charges: RenaultCharge[];
    chargesFilters: string[];
    hasError: boolean;
    shouldDisplayChargesCard(): boolean;
    setCharges(charges: RenaultCharge[]): void;
    getTotalEnergyRecovered(): number;
    getTotalTimeCharging(): TotalChargeDuration;
    compareIndexCharge(date1: string, date2: string, sortDesc: boolean): number;
}

type TotalChargeDuration = {
    hours: number;
    minutes: number;
}

class RenaultChargesHandler implements RenaultChargesHandler {
    constructor(charges: RenaultCharge[] = [], hasError = false) {
        this.charges = charges;
        this.hasError = hasError;
        this.chargesFilters = [];
    }

    shouldDisplayChargesCard(): boolean {
        return !this.hasError;
    }

    setCharges(charges: RenaultCharge[]) {
        this.charges = charges;
    }

    getCharges(): RenaultCharge[] {
        return this.charges;
    }

    getTotalEnergyRecovered(): number {
        let totalEnergy = 0;
        this.charges.forEach(charge => {
            totalEnergy += charge.chargeEnergyRecovered ?? 0;
        });
        return parseFloat(totalEnergy.toFixed(2));
    }

    getTotalTimeCharging(): TotalChargeDuration {
        let totalTimeCharging = 0;
        for (const charge of this.charges) {
            totalTimeCharging += charge.chargeDuration ?? 0;
        }
        let heures = Math.floor(totalTimeCharging / 60);
        let minutes = totalTimeCharging % 60;
        return {
            hours: heures,
            minutes: minutes
        }
    }

    static readonly applyFilters = (filters: Filter[], charges: RenaultCharge[]) => {
        let chargesToDisplay = charges;
        // iterate over filters
        for (const filter of filters) {
            switch (filter.filterName) {
                case FilterName.AVERAGE_POWER:
                    chargesToDisplay = chargesToDisplay.filter(charge => charge.getAverageChargeSpeed() >= (filter.filterType as FilterNumerical).min && charge.getAverageChargeSpeed() <= (filter.filterType as FilterNumerical).max);
                    break;
                case FilterName.ENERGY_RECOVERED:
                    chargesToDisplay = chargesToDisplay.filter(charge => charge.getEnergyRecovered() >= (filter.filterType as FilterNumerical).min && charge.getEnergyRecovered() <= (filter.filterType as FilterNumerical).max);
                    break;
                case FilterName.PERCENTAGE_RECOVERED:
                    chargesToDisplay = chargesToDisplay.filter(charge => (charge.getEndPercentage() - charge.getStartPercentage()) >= (filter.filterType as FilterNumerical).min && (charge.getEndPercentage() - charge.getStartPercentage()) <= (filter.filterType as FilterNumerical).max);
                    break;
                case FilterName.DATE: {
                    const minDate = (filter.filterType as FilterDate).startDate || new Date(0);
                    const maxDate = (filter.filterType as FilterDate).endDate || new Date();
                    chargesToDisplay = chargesToDisplay.filter(charge => {
                        const chargeDate = charge.getStartDate();
                        return chargeDate >= minDate && chargeDate <= maxDate;
                    });
                    break;
                }
                case FilterName.ONLY_DC:
                    chargesToDisplay = chargesToDisplay.filter(charge => charge.getAverageChargeSpeed() >= 26);
                    break;
            }
        }
        return chargesToDisplay;
    };

    static readonly getLastMonthIndex = (charges: RenaultCharge[], filters: Filter[]): number => {
        // this method computes the maximum displayedMonths
        const filteredCharges = this.applyFilters(filters, charges);
        const seenMonth: string[] = [];
        for (const charge of filteredCharges) {
            const chargeDate = charge.getStartDate();
            const month = chargeDate.getMonth();
            const year = chargeDate.getFullYear();
            const monthYear = month + "-" + year;
            if (!seenMonth.includes(monthYear)) {
                // it is the first time this month is seen
                seenMonth.push(monthYear);
            }
        }
        return seenMonth.length;
    };

    static readonly addNewCharge = (chargesIndex: ChargeIndex[], monthYear: string, month: number, year: number, charge: RenaultCharge) => {
        let chargeIndex = chargesIndex.findIndex((chargeIndex) => chargeIndex.monthYear === monthYear);
        if (chargeIndex == -1) {
            chargesIndex.push({
                monthYear: monthYear,
                monthNumber: month,
                year: year,
                charges: [charge],
                totalTimeCharged: [0, 0],
                totalEnergyRecovered: 0
            });
            chargeIndex = chargesIndex.length - 1;
        } else {
            chargesIndex[chargeIndex].charges.push(charge);
        }
        return chargeIndex;
    };

    static readonly buildChargeIndex = (charges: RenaultCharge[], monthLimit: number): ChargeIndex[] => {
        let chargesIndex: ChargeIndex[] = [];
        const seenMonth: string[] = [];
        for (const charge of charges) {
            const chargeDate = charge.getStartDate();
            const month = chargeDate.getMonth();
            const year = chargeDate.getFullYear();
            const monthYear = month + "-" + year;
            if (!seenMonth.includes(monthYear)) {
                // it is the first time this month is seen
                seenMonth.push(monthYear);
            }
            if (seenMonth.length > monthLimit) {
                // we have seen enough months, we can stop
                break;
            }
            const chargeIndex = this.addNewCharge(chargesIndex, monthYear, month, year, charge);

            chargesIndex[chargeIndex].totalEnergyRecovered += (charge.chargeEnergyRecovered ?? 0);
            const hours = (charge.chargeDuration ?? 0) / 60;
            const minutes = (charge.chargeDuration ?? 0) % 60;
            chargesIndex[chargeIndex].totalTimeCharged[0] += hours;
            chargesIndex[chargeIndex].totalTimeCharged[1] += minutes;
            if (chargesIndex[chargeIndex].totalTimeCharged[1] >= 60) {
                chargesIndex[chargeIndex].totalTimeCharged[1] -= 60;
            }
        }
        return chargesIndex;
    }

    static readonly mergeCharges = (uniqueCharges: RenaultCharge[]): RenaultCharge[] => {
        // now merge the charges where the end charge level is the same as the chare start level of the next charge
        const mergedCharges: RenaultCharge[] = [];
        let i = 0;
        while (i < uniqueCharges.length) {
            let currentCharge = uniqueCharges[i];
            let j = i + 1;
            // Try to merge as many consecutive charges as possible
            while (
                j < uniqueCharges.length &&
                currentCharge.chargeEndBatteryLevel === uniqueCharges[j].chargeStartBatteryLevel &&
                currentCharge.isV2G === uniqueCharges[j].isV2G
            ) {
                const nextCharge = uniqueCharges[j];
                const subCharges = (currentCharge.subCharges && currentCharge.subCharges.length !== 0)
                    ? [...currentCharge.subCharges, nextCharge]
                    : [currentCharge, nextCharge];

                currentCharge = new RenaultCharge(
                    currentCharge.chargeStartDate,
                    nextCharge.chargeEndDate,
                    (currentCharge.chargeDuration ?? 0) + (nextCharge.chargeDuration ?? 0),
                    currentCharge.chargeStartBatteryLevel,
                    nextCharge.chargeEndBatteryLevel,
                    (currentCharge.chargeEnergyRecovered ?? 0) + (nextCharge.chargeEnergyRecovered ?? 0),
                    nextCharge.chargeEndStatus,
                    true, // is a merged charge,
                    subCharges, // subcharges associated to this merged charge,
                    currentCharge.mileageAtStart,
                    currentCharge.inaccurateMileage && nextCharge.inaccurateMileage,
                    currentCharge.getV2GEnergyDischarged() + nextCharge.getV2GEnergyDischarged(),
                    currentCharge.isV2G || nextCharge.isV2G

                );
                j++;
            }
            mergedCharges.push(currentCharge);
            i = j;
        }
        return mergedCharges;
    }

    static readonly buildChargesIndex = (filters: Filter[], charges: RenaultCharge[], appPreferences: AppPreferences, sortDesc = true, monthLimit: number = 2): ChargeIndex[] => {
        // monthLimit is the number of months to display in the index

        // first, apply filters
        charges = this.applyFilters(filters, charges);

        if (appPreferences.mergeCharges) {
            charges = this.mergeCharges(charges);
        }

        if (sortDesc) {
            // sort by date
            charges.sort((a, b) => b.getStartDate().getTime() - a.getStartDate().getTime());
        } else {
            charges.sort((a, b) => a.getStartDate().getTime() - b.getStartDate().getTime());
        }


        const chargesIndex = this.buildChargeIndex(charges, monthLimit);

        for (const chargeIndex of chargesIndex) {
            chargeIndex.totalEnergyRecovered = parseFloat(chargeIndex.totalEnergyRecovered.toFixed(2));
            chargeIndex.totalTimeCharged[0] = Math.floor(chargeIndex.totalTimeCharged[0]);
            chargeIndex.totalTimeCharged[1] = Math.floor(chargeIndex.totalTimeCharged[1]);
            // re sort charges by date
            if (sortDesc)
                chargeIndex.charges.sort((a, b) => b.getStartDate().getTime() - a.getStartDate().getTime());
            else
                chargeIndex.charges.sort((a, b) => a.getStartDate().getTime() - b.getStartDate().getTime());
        }

        // sort by date
        chargesIndex.sort((a, b) => this.compareIndexCharges(a.monthYear, b.monthYear, sortDesc));
        return chargesIndex;
    }

    static readonly compareIndexCharges = (date1: string, date2: string, sortDesc = true): number => {
        const [month1, year1] = date1.split('-').map(Number);
        const [month2, year2] = date2.split('-').map(Number);

        if (sortDesc) {
            if (year1 !== year2) {
                return year2 - year1;
            } else {
                return month2 - month1;
            }
        }
        if (year1 !== year2) {
            return year1 - year2;
        } else {
            return month1 - month2;
        }
    }
}

export default RenaultChargesHandler;
export type { ChargeIndex, TotalChargeDuration };