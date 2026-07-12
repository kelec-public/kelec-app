import { DateOrder, DateParser } from "../types/dateParser";

export function buildDateParser(samples: string[]): DateParser {
    const norm = (s: string): string => s.replace(/[\u202f\u00a0]/g, ' ').trim();
    const cleaned = samples.map(norm);

    const hasAmPm = cleaned.some(s => /\b(AM|PM)\b/i.test(s));
    const usesDash = cleaned.some(s => /^\d{4}-\d{1,2}-\d{1,2}/.test(s)); // ISO / en-CA

    // 1) Détermine l'ordre via une valeur où un nombre > 12 (preuve directe)
    let order: DateOrder | null = null;
    for (const s of cleaned) {
        const m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.]\d{4}/);
        if (m) {
            if (+m[1] > 12) { order = 'DMY'; break; }
            if (+m[2] > 12) { order = 'MDY'; break; }
        }
    }
    // 2) Sinon, hypothèse par famille
    if (usesDash) order = 'YMD';
    else if (!order) order = hasAmPm ? 'MDY' : 'DMY'; // US 12h vs fr/GB/fi/de

    // Parseur configuré pour CE fichier
    return function parse(raw: string): Date | null {
        const s = norm(raw);
        const n: number[] | undefined = s.match(/\d+/g)?.map(Number);
        if (!n || n.length < 3) return null;

        let y: number, mo: number, d: number, h = 0, mi = 0, se = 0;
        if (order === 'YMD') { [y, mo, d, h = 0, mi = 0, se = 0] = n; }
        else if (order === 'DMY') { [d, mo, y, h = 0, mi = 0, se = 0] = n; }
        else { [mo, d, y, h = 0, mi = 0, se = 0] = n; }

        if (/\bPM\b/i.test(s) && h < 12) h += 12;  // 12h -> 24h
        if (/\bAM\b/i.test(s) && h === 12) h = 0;

        return new Date(y, mo - 1, d, h, mi, se);
    };
}