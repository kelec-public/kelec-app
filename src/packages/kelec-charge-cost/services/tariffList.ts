import { parseLocalDate, sortTariffs, Tariff, toLocalDate } from "../models/Tariff";
import { Validated } from "../models/tariffDraft";

/** Ce qui situe un tarif dans le temps. */
export type TariffPeriod = Pick<Tariff, 'id' | 'validFrom'>;

/** Ajoute le tarif, ou remplace celui qui a le même `id`. */
export function upsertTariff(tariffs: Tariff[], tariff: Tariff): Validated<Tariff[]> {
    const existing = tariffs.find(other => other.id === tariff.id);
    const others = tariffs.filter(other => other.id !== tariff.id);

    // le tarif « depuis le début » le reste : sinon les charges plus anciennes n'auraient plus de prix
    const isFirst = existing ? existing.validFrom === null : tariffs.length === 0;
    if (isFirst !== (tariff.validFrom === null)) return { ok: false, errorKey: 'tariffStartDateRequired' };
    if (others.some(other => other.validFrom === tariff.validFrom)) return { ok: false, errorKey: 'tariffSameStartDate' };

    return { ok: true, value: sortTariffs([...others, tariff]) };
}

/** Les tarifs avec celui en cours de saisie (ajouté, ou à la place de sa version enregistrée), pour situer sa période. */
export function withPeriod(tariffs: TariffPeriod[], period: TariffPeriod): TariffPeriod[] {
    return [...tariffs.filter(other => other.id !== period.id), period];
}

/** Le tarif « depuis le début » ne se supprime que s'il est seul. Sa période est reprise par le tarif précédent. */
export function canDeleteTariff(tariffs: Tariff[], id: string): boolean {
    const tariff = tariffs.find(other => other.id === id);
    return !!tariff && (tariff.validFrom !== null || tariffs.length === 1);
}

export function deleteTariff(tariffs: Tariff[], id: string): Validated<Tariff[]> {
    if (!canDeleteTariff(tariffs, id)) return { ok: false, errorKey: 'cannotDeleteFirstTariff' };
    return { ok: true, value: tariffs.filter(tariff => tariff.id !== id) };
}

/** Fin d'un tarif : la veille du début du suivant (date locale « AAAA-MM-JJ »), ou `null` s'il est en cours. */
export function tariffEnd(tariffs: TariffPeriod[], id: string): string | null {
    const sorted = sortTariffs(tariffs);
    const index = sorted.findIndex(tariff => tariff.id === id);
    if (index < 0) return null;
    const next = sorted[index + 1];
    if (!next?.validFrom) return null;
    const nextStart = parseLocalDate(next.validFrom);
    return toLocalDate(new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() - 1));
}

export type TariffStatus = 'past' | 'current' | 'upcoming';

/** Tarif terminé, en cours ou à venir, à la date locale `today` (« AAAA-MM-JJ »). */
export function tariffStatus(tariffs: TariffPeriod[], id: string, today: string): TariffStatus {
    const tariff = tariffs.find(other => other.id === id);
    if (tariff?.validFrom && tariff.validFrom > today) return 'upcoming';
    const end = tariffEnd(tariffs, id);
    return end !== null && end < today ? 'past' : 'current';
}
