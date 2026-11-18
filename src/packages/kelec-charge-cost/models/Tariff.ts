/**
 * Devises proposées pour les prix de l'électricité : l'euro, puis les autres devises de l'Union européenne,
 * de l'Espace économique européen, du Royaume-Uni et de la Suisse.
 */
export const CURRENCIES = ['EUR', 'GBP', 'CHF', 'NOK', 'SEK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON'] as const;
export type Currency = typeof CURRENCIES[number];

/** Jour de la semaine, numéroté comme `Date.getDay()` : 0 = dimanche … 6 = samedi. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Jours dans l'ordre d'affichage : la semaine commence le lundi. */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/**
 * Plage d'heures creuses, en heures locales « HH:MM » (heure du téléphone).
 * Si `end` est avant `start`, la plage passe minuit (ex. 22:00 → 06:00).
 */
export type OffPeakSlot = {
    start: string;
    end: string;
    /**
     * Jours où la plage commence (une plage qui passe minuit finit le lendemain matin).
     * Absent : tous les jours (les tarifs enregistrés avant les jours n'ont pas ce champ). Jamais vide.
     */
    days?: Weekday[];
};

/** Jours où la plage commence, dans l'ordre de la semaine. */
export function slotDays(slot: OffPeakSlot): Weekday[] {
    const days = slot.days;
    return days ? WEEKDAYS.filter(day => days.includes(day)) : [...WEEKDAYS];
}

export function slotStartsOn(slot: OffPeakSlot, day: Weekday): boolean {
    return !slot.days || slot.days.includes(day);
}

/** Jours choisis → champ `days` : absent quand ce sont tous les jours. */
export function withDays(slot: OffPeakSlot, days: Weekday[]): OffPeakSlot {
    const sorted = WEEKDAYS.filter(day => days.includes(day));
    const everyDay = { start: slot.start, end: slot.end };
    return sorted.length === WEEKDAYS.length ? everyDay : { ...everyDay, days: sorted };
}

type TariffBase = {
    id: string;
    /**
     * Date locale « AAAA-MM-JJ » à partir de laquelle le tarif s'applique (00:00, heure du téléphone).
     * `null` : depuis le début. C'est toujours le premier tarif, et le seul sans date.
     */
    validFrom: string | null;
};

export type FlatTariff = TariffBase & {
    kind: 'flat';
    pricePerKwh: number;
};

export type PeakOffPeakTariff = TariffBase & {
    kind: 'peakOffPeak';
    peakPrice: number;
    offPeakPrice: number;
    offPeakSlots: OffPeakSlot[];
};

export type Tariff = FlatTariff | PeakOffPeakTariff;
export type TariffKind = Tariff['kind'];

/** Tarifs de l'électricité à la maison, communs à toutes les voitures. Un tarif s'arrête quand le suivant commence. */
export type TariffSettings = {
    currency: Currency;
    tariffs: Tariff[];
};

export const DEFAULT_CURRENCY: Currency = 'EUR';

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidTimeOfDay(value: string): boolean {
    return TIME_OF_DAY.test(value);
}

/** Minutes depuis minuit d'une heure « HH:MM ». */
export function minutesOfDay(time: string): number {
    const match = TIME_OF_DAY.exec(time);
    if (!match) throw new Error(`Invalid time of day: ${time}`);
    return Number(match[1]) * 60 + Number(match[2]);
}

export function timeOfDayFromDate(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** « AAAA-MM-JJ » → minuit, heure locale. */
export function parseLocalDate(value: string): Date {
    const match = LOCAL_DATE.exec(value);
    if (!match) throw new Error(`Invalid local date: ${value}`);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function toLocalDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Tarifs triés par date de début : le tarif « depuis le début » en premier. */
export function sortTariffs<T extends Pick<Tariff, 'validFrom'>>(tariffs: T[]): T[] {
    return [...tariffs].sort((a, b) => {
        if (a.validFrom === b.validFrom) return 0;
        if (a.validFrom === null) return -1;
        if (b.validFrom === null) return 1;
        return a.validFrom < b.validFrom ? -1 : 1;
    });
}
