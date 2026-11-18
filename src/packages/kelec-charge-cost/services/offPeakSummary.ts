import { OffPeakSlot, slotStartsOn, Weekday, WEEKDAYS } from "../models/Tariff";
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

/** Jours qui ont les mêmes plages d'heures creuses (celles qui commencent ces jours-là). */
export type DaySchedule = {
    days: Weekday[];
    slots: OffPeakSlot[];
};

/**
 * Plages de chaque jour, les jours aux plages identiques regroupés, dans l'ordre de la semaine (à partir du lundi).
 * Une seule entrée (les 7 jours) quand toutes les plages valent tous les jours.
 * Les jours sans plage forment une entrée sans plage.
 */
export function daySchedules(slots: OffPeakSlot[]): DaySchedule[] {
    const schedules = new Map<string, DaySchedule>();
    for (const day of WEEKDAYS) {
        const indices = slots.flatMap((slot, index) => slotStartsOn(slot, day) ? [index] : []);
        const key = indices.join(',');
        const schedule = schedules.get(key);
        if (schedule) schedule.days.push(day);
        else schedules.set(key, { days: [day], slots: indices.map(index => slots[index]) });
    }
    return [...schedules.values()];
}

/** Les heures creuses sont les mêmes tous les jours. */
export function isSameEveryDay(slots: OffPeakSlot[]): boolean {
    return daySchedules(slots).length === 1;
}

/** Minutes d'heures creuses par semaine. */
export function offPeakMinutesPerWeek(slots: OffPeakSlot[]): number {
    return daySchedules(slots).reduce((total, schedule) => total + offPeakMinutesPerDay(schedule.slots) * schedule.days.length, 0);
}

/** Nom du jour au format du téléphone (« lun. », « Mon »). Le 7 janvier 2024 est un dimanche. */
export function weekdayName(day: Weekday, format: 'narrow' | 'short' | 'long' = 'short'): string {
    return new Date(2024, 0, 7 + day).toLocaleDateString(undefined, { weekday: format });
}

/**
 * Jours de la semaine en texte : trois jours qui se suivent ou plus deviennent un intervalle
 * (« lun. – ven. », « lun., mer., sam. – dim. »).
 */
export function formatDays(days: Weekday[], name: (day: Weekday) => string = day => weekdayName(day)): string {
    const positions = WEEKDAYS.flatMap((day, position) => days.includes(day) ? [position] : []);
    const runs: number[][] = [];
    positions.forEach(position => {
        const run = runs.at(-1);
        if (run?.at(-1) === position - 1) run.push(position);
        else runs.push([position]);
    });
    return runs.flatMap(run => run.length >= 3
        ? [`${name(WEEKDAYS[run[0]])} – ${name(WEEKDAYS[run[run.length - 1]])}`]
        : run.map(position => name(WEEKDAYS[position])),
    ).join(', ');
}
