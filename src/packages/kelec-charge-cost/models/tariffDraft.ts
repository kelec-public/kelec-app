import { isValidTimeOfDay, OffPeakSlot, Tariff, TariffKind, toLocalDate } from "./Tariff";

/** Tarif en cours de saisie : les prix restent du texte tant qu'ils ne sont pas validés. */
export type TariffDraft = {
    id: string;
    validFrom: string | null;
    kind: TariffKind;
    pricePerKwh: string;
    peakPrice: string;
    offPeakPrice: string;
    offPeakSlots: OffPeakSlot[];
};

/** Résultat d'une validation : la valeur, ou la clé de traduction de l'erreur. */
export type Validated<T> = { ok: true; value: T } | { ok: false; errorKey: string };

export const DEFAULT_OFF_PEAK_SLOT: OffPeakSlot = { start: '22:00', end: '06:00' };

/** Nouveau tarif : « depuis le début » si c'est le premier, sinon à partir d'aujourd'hui. */
export function newDraft(id: string, tariffs: Tariff[], today: Date): TariffDraft {
    return {
        id,
        validFrom: tariffs.length === 0 ? null : toLocalDate(today),
        kind: 'flat',
        pricePerKwh: '',
        peakPrice: '',
        offPeakPrice: '',
        offPeakSlots: [DEFAULT_OFF_PEAK_SLOT],
    };
}

export function draftFromTariff(tariff: Tariff): TariffDraft {
    const draft = newDraft(tariff.id, [], new Date());
    draft.validFrom = tariff.validFrom;
    draft.kind = tariff.kind;
    if (tariff.kind === 'flat') {
        draft.pricePerKwh = String(tariff.pricePerKwh);
    } else {
        draft.peakPrice = String(tariff.peakPrice);
        draft.offPeakPrice = String(tariff.offPeakPrice);
        draft.offPeakSlots = tariff.offPeakSlots;
    }
    return draft;
}

/** Prix saisi (virgule ou point) → nombre positif, ou `null`. */
export function parsePrice(text: string): number | null {
    const normalized = text.trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
    return Number(normalized);
}

export function tariffFromDraft(draft: TariffDraft): Validated<Tariff> {
    const base = { id: draft.id, validFrom: draft.validFrom };

    if (draft.kind === 'flat') {
        const pricePerKwh = parsePrice(draft.pricePerKwh);
        if (pricePerKwh === null) return { ok: false, errorKey: 'invalidPrice' };
        return { ok: true, value: { ...base, kind: 'flat', pricePerKwh } };
    }

    const peakPrice = parsePrice(draft.peakPrice);
    const offPeakPrice = parsePrice(draft.offPeakPrice);
    if (peakPrice === null || offPeakPrice === null) return { ok: false, errorKey: 'invalidPrice' };
    if (draft.offPeakSlots.length === 0) return { ok: false, errorKey: 'addAtLeastOneOffPeakSlot' };
    const isSlotValid = (slot: OffPeakSlot) =>
        isValidTimeOfDay(slot.start) && isValidTimeOfDay(slot.end) && slot.start !== slot.end;
    if (!draft.offPeakSlots.every(isSlotValid)) return { ok: false, errorKey: 'invalidOffPeakSlot' };

    return { ok: true, value: { ...base, kind: 'peakOffPeak', peakPrice, offPeakPrice, offPeakSlots: draft.offPeakSlots } };
}
