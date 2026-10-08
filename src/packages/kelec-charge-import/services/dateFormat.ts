/**
 * Lecture des dates d'un export de l'historique de charge.
 *
 * Selon la version de l'app qui a fait l'export, une date est :
 * - en ISO, telle que renvoyée par l'API (`2024-08-23T07:57:41Z`) : exports d'avant décembre 2024 ;
 * - au format local du téléphone (`Date.toLocaleString()`), donc en heure locale et dans un ordre
 *   qui dépend de la langue : `08/10/2026 14:05:09` (fr), `10/8/2026, 2:05:09 PM` (en-US),
 *   `8.10.2026 klo 14.05.09` (fi), `2026-10-08 14:05:09` (sv)… ;
 * - une vraie date, si le fichier a été modifié puis enregistré dans un tableur.
 */

/** Ordre du jour, du mois et de l'année dans une date écrite en chiffres. */
export type DateOrder = 'DMY' | 'MDY' | 'YMD';

export type DateParser = (value: unknown) => Date | null;

/** Date avec heure et fuseau (ou `Z`) : lisible directement par `Date`. */
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Indicateurs matin / après-midi des formats 12 h (en-US, en-CA, el, ko, zh, ja…). */
const PM_MARKER = /(^|[^a-z])p\.?\s?m\.?($|[^a-z])|μ\.μ\.|오후|下午|午後/i;
const AM_MARKER = /(^|[^a-z])a\.?\s?m\.?($|[^a-z])|π\.μ\.|오전|上午|午前/i;

/** Années acceptées : de quoi écarter une date mal interprétée (ex. calendrier bouddhiste, 2569). */
const MIN_YEAR = 2000;

/** Remplace les chiffres arabes orientaux / persans par des chiffres latins. */
const toLatinDigits = (text: string): string =>
    text.replace(/[٠-٩۰-۹]/g, digit => {
        const code = digit.charCodeAt(0);
        return String(code - (code >= 0x06F0 ? 0x06F0 : 0x0660));
    });

const numbersIn = (text: string): string[] => toLatinDigits(text).match(/\d+/g) ?? [];

const isIsoDateTime = (text: string): boolean => ISO_DATE_TIME.test(text.trim());

/** Ordre de la locale de l'appareil, déduit d'une date connue (22/11/2001). */
export const deviceDateOrder = (): DateOrder => {
    const [first] = numbersIn(new Date(2001, 10, 22).toLocaleDateString());
    if (first === '2001') return 'YMD';
    if (first === '11') return 'MDY';
    return 'DMY';
};

/**
 * Ordre jour / mois des dates locales du fichier. Un nombre supérieur à 12 en première position
 * prouve un ordre jour-mois, en deuxième position un ordre mois-jour. Sans preuve (tous les jours ≤ 12),
 * on suppose que le fichier a été exporté depuis ce téléphone : `fallback` (ordre de l'appareil).
 */
export const detectDateOrder = (samples: string[], fallback: DateOrder): DateOrder => {
    let dayFirst = 0;
    let monthFirst = 0;
    for (const sample of samples) {
        if (isIsoDateTime(sample)) continue;
        const [first, second] = numbersIn(sample);
        if (first === undefined || second === undefined || first.length === 4) continue;
        if (Number(first) > 12) dayFirst++;
        else if (Number(second) > 12) monthFirst++;
    }
    if (dayFirst === 0 && monthFirst === 0) return fallback;
    return dayFirst >= monthFirst ? 'DMY' : 'MDY';
};

/** Construit la date, ou null si un champ est hors limites (ex. 31/02). */
const buildDate = (year: number, month: number, day: number, hours: number, minutes: number, seconds: number): Date | null => {
    const fullYear = year < 100 ? 2000 + year : year;
    if (fullYear < MIN_YEAR || fullYear > new Date().getFullYear() + 1) return null;
    if (hours > 23 || minutes > 59 || seconds > 59) return null;

    const date = new Date(fullYear, month - 1, day, hours, minutes, seconds);
    const isSameDay = date.getFullYear() === fullYear && date.getMonth() === month - 1 && date.getDate() === day;
    return isSameDay ? date : null;
};

/** Date locale écrite en chiffres (heure locale de l'appareil). */
const parseLocalDate = (text: string, order: DateOrder): Date | null => {
    const numbers = numbersIn(text).map(Number);
    if (numbers.length < 3) return null;

    // Une année en tête (sv, lt, ja, ko, en-CA…) se reconnaît à ses 4 chiffres, quel que soit l'ordre du fichier.
    const rowOrder: DateOrder = numbersIn(text)[0].length === 4 ? 'YMD' : order;
    const [a, b, c, hours = 0, minutes = 0, seconds = 0] = numbers;
    const [year, month, day] =
        rowOrder === 'YMD' ? [a, b, c]
            : rowOrder === 'DMY' ? [c, b, a]
                : [c, a, b];

    let hours24 = hours;
    if (PM_MARKER.test(text) && hours < 12) hours24 += 12;
    if (AM_MARKER.test(text) && hours === 12) hours24 = 0;

    return buildDate(year, month, day, hours24, minutes, seconds);
};

/**
 * Prépare un lecteur de dates pour un fichier : l'ordre jour / mois est déterminé une fois
 * pour toutes à partir de toutes les dates du fichier (`samples`).
 */
export const createDateParser = (samples: unknown[], fallback: DateOrder = deviceDateOrder()): DateParser => {
    const texts = samples.filter((sample): sample is string => typeof sample === 'string');
    const order = detectDateOrder(texts, fallback);

    return (value: unknown): Date | null => {
        if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
        if (typeof value !== 'string' || value.trim() === '') return null;

        if (isIsoDateTime(value)) {
            const date = new Date(value.trim());
            return isNaN(date.getTime()) ? null : date;
        }
        return parseLocalDate(value, order);
    };
};
