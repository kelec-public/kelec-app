import { OffPeakSlot } from "../models/Tariff";
import { slotMinutes } from "../models/tariffDraft";

const DAY_MINUTES = 24 * 60;

/** Plages en minutes dans la journée, celles qui passent minuit coupées en deux (pour la frise de 00h à 24h). */
export function offPeakRanges(slots: OffPeakSlot[]): [number, number][] {
    return slots.flatMap(slotMinutes);
}

/** Pour chaque minute de la journée : en heures creuses ou non. */
function offPeakMinutes(slots: OffPeakSlot[]): boolean[] {
    const covered = new Array<boolean>(DAY_MINUTES).fill(false);
    offPeakRanges(slots).forEach(([start, end]) => covered.fill(true, start, end));
    return covered;
}

/** Minutes d'heures creuses par jour ; un temps couvert par deux plages ne compte qu'une fois. */
export function offPeakMinutesPerDay(slots: OffPeakSlot[]): number {
    return offPeakMinutes(slots).filter(Boolean).length;
}

/** Minutes depuis minuit → « HH:MM » (1440 → « 00:00 »). */
function timeOfDay(minutes: number): string {
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Heures pleines : le reste de la journée, dans l'ordre de la journée (ex. 06:00 → 22:00 pour des heures creuses 22:00 → 06:00).
 * Une plage qui passe minuit n'est pas coupée. Vide si les heures creuses couvrent toute la journée.
 */
export function peakSlots(offPeak: OffPeakSlot[]): OffPeakSlot[] {
    const covered = offPeakMinutes(offPeak);
    const ranges: [number, number][] = [];
    covered.forEach((isOffPeak, minute) => {
        if (isOffPeak) return;
        const last = ranges.at(-1);
        if (last?.[1] === minute) last[1] = minute + 1;
        else ranges.push([minute, minute + 1]);
    });
    // une plage qui finit à minuit continue avec celle qui commence à minuit
    const [morning, ...rest] = ranges;
    const evening = rest.at(-1);
    if (morning?.[0] === 0 && evening?.[1] === DAY_MINUTES) {
        evening[1] = morning[1];
        return rest.map(([start, end]) => ({ start: timeOfDay(start), end: timeOfDay(end) }));
    }
    return ranges.map(([start, end]) => ({ start: timeOfDay(start), end: timeOfDay(end) }));
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
