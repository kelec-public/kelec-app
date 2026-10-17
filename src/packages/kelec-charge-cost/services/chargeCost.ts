import { minutesOfDay, OffPeakSlot, parseLocalDate, sortTariffs, Tariff } from "../models/Tariff";

type Interval = { start: number; end: number }; // ms

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Coût d'une charge avec les tarifs donnés, ou `null` s'il n'y a aucun tarif.
 *
 * L'énergie est répartie au prorata du temps : on suppose une puissance constante pendant la charge.
 * Une charge qui chevauche un changement de tarif ou une plage d'heures creuses est donc coupée en morceaux.
 * Les heures et les dates des tarifs sont lues dans le fuseau du téléphone.
 */
export function computeCost(start: Date, end: Date, energyKwh: number, tariffs: Tariff[]): number | null {
    if (tariffs.length === 0) return null;

    const charge = { start: start.getTime(), end: end.getTime() };
    const duration = charge.end - charge.start;

    let cost = 0;
    for (const { tariff, period } of tariffPeriods(sortTariffs(tariffs))) {
        if (duration <= 0) {
            // charge sans durée : tout au prix du début
            if (contains(period, charge.start)) return energyKwh * priceAt(tariff, charge.start);
            continue;
        }
        const part = intersect(charge, period);
        if (!part) continue;
        const kwhPerMs = energyKwh / duration;
        cost += kwhPerMs * partCost(tariff, part);
    }
    return cost;
}

/** Période de chaque tarif : de sa date de début jusqu'au début du suivant. */
function tariffPeriods(sorted: Tariff[]): { tariff: Tariff; period: Interval }[] {
    return sorted.map((tariff, index) => {
        const next = sorted[index + 1];
        return {
            tariff,
            period: {
                start: tariff.validFrom === null ? -Infinity : parseLocalDate(tariff.validFrom).getTime(),
                end: next?.validFrom ? parseLocalDate(next.validFrom).getTime() : Infinity,
            },
        };
    });
}

/** Somme « prix × durée » sur l'intervalle (en ms). */
function partCost(tariff: Tariff, part: Interval): number {
    const length = part.end - part.start;
    if (tariff.kind === 'flat') return tariff.pricePerKwh * length;

    const offPeak = offPeakDuration(tariff.offPeakSlots, part);
    return tariff.offPeakPrice * offPeak + tariff.peakPrice * (length - offPeak);
}

function priceAt(tariff: Tariff, instant: number): number {
    if (tariff.kind === 'flat') return tariff.pricePerKwh;
    const isOffPeak = offPeakDuration(tariff.offPeakSlots, { start: instant, end: instant + 1 }) > 0;
    return isOffPeak ? tariff.offPeakPrice : tariff.peakPrice;
}

/** Temps passé en heures creuses dans l'intervalle. Les plages qui se chevauchent ne sont comptées qu'une fois. */
function offPeakDuration(slots: OffPeakSlot[], part: Interval): number {
    const intervals: Interval[] = [];
    // on part de la veille, pour une plage qui passe minuit
    const firstDay = startOfLocalDay(part.start - DAY_MS);
    for (let day = firstDay; day < part.end; day = nextLocalDay(day)) {
        for (const slot of slots) {
            const interval = slotOnDay(slot, day);
            const overlap = intersect(interval, part);
            if (overlap) intervals.push(overlap);
        }
    }
    return mergedLength(intervals);
}

function slotOnDay(slot: OffPeakSlot, day: number): Interval {
    const start = atMinutes(day, minutesOfDay(slot.start));
    const endMinutes = minutesOfDay(slot.end);
    // fin avant (ou égale au) début : la plage passe minuit
    const endDay = endMinutes <= minutesOfDay(slot.start) ? nextLocalDay(day) : day;
    return { start, end: atMinutes(endDay, endMinutes) };
}

/** Heure locale du jour donné. `new Date(a, m, j, h, min)` gère les changements d'heure. */
function atMinutes(day: number, minutes: number): number {
    const date = new Date(day);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(minutes / 60), minutes % 60).getTime();
}

function startOfLocalDay(instant: number): number {
    const date = new Date(instant);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function nextLocalDay(day: number): number {
    const date = new Date(day);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

function intersect(a: Interval, b: Interval): Interval | null {
    const start = Math.max(a.start, b.start);
    const end = Math.min(a.end, b.end);
    return start < end ? { start, end } : null;
}

function contains(interval: Interval, instant: number): boolean {
    return interval.start <= instant && instant < interval.end;
}

function mergedLength(intervals: Interval[]): number {
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    let total = 0;
    let current: Interval | null = null;
    for (const interval of sorted) {
        if (current && interval.start <= current.end) {
            current.end = Math.max(current.end, interval.end);
        } else {
            if (current) total += current.end - current.start;
            current = { ...interval };
        }
    }
    if (current) total += current.end - current.start;
    return total;
}
