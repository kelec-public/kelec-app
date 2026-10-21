import { OffPeakSlot } from "../models/Tariff";
import { slotMinutes } from "../models/tariffDraft";

const DAY_MINUTES = 24 * 60;

/** Plages en minutes dans la journée, celles qui passent minuit coupées en deux (pour la frise de 00h à 24h). */
export function offPeakRanges(slots: OffPeakSlot[]): [number, number][] {
    return slots.flatMap(slotMinutes);
}

/** Minutes d'heures creuses par jour ; un temps couvert par deux plages ne compte qu'une fois. */
export function offPeakMinutesPerDay(slots: OffPeakSlot[]): number {
    const covered = new Array<boolean>(DAY_MINUTES).fill(false);
    offPeakRanges(slots).forEach(([start, end]) => covered.fill(true, start, end));
    return covered.filter(Boolean).length;
}

/** « 8 h », « 7 h 30 ». */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}

/** Économie des heures creuses en % (ex. 28), ou `null` si elles ne coûtent pas moins cher. */
export function offPeakSaving(peakPrice: number | null, offPeakPrice: number | null): number | null {
    if (peakPrice === null || offPeakPrice === null || peakPrice <= 0 || offPeakPrice >= peakPrice) return null;
    return Math.round((1 - offPeakPrice / peakPrice) * 100);
}
