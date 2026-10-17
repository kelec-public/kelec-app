import { Currency, Tariff } from "../models/Tariff";
import { formatLocalDate, formatPricePerKwh } from "../services/priceFormat";
import { tariffEnd, TariffPeriod } from "../services/tariffList";

type Translate = (key: string) => string;

/** « Depuis le début → 31/01/2027 », « À partir du 01/02/2027 ». */
export function periodLabel(tariffs: TariffPeriod[], tariff: TariffPeriod, t: Translate): string {
    const start = tariff.validFrom === null ? t("sinceTheBeginning") : `${t("fromDate")} ${formatLocalDate(tariff.validFrom)}`;
    const end = tariffEnd(tariffs, tariff.id);
    return end ? `${start} → ${formatLocalDate(end)}` : start;
}

/** « 0,2516 €/kWh », ou « HP 0,27 €/kWh · HC 0,21 €/kWh ». */
export function priceLabel(tariff: Tariff, currency: Currency, t: Translate): string {
    if (tariff.kind === 'flat') return formatPricePerKwh(tariff.pricePerKwh, currency);
    return `${t("peakPrice")} ${formatPricePerKwh(tariff.peakPrice, currency)} · ${t("offPeakPrice")} ${formatPricePerKwh(tariff.offPeakPrice, currency)}`;
}

/** « 22:00 → 06:00, 12:30 → 14:30 » (heures creuses), ou chaîne vide pour un prix fixe. */
export function slotsLabel(tariff: Tariff): string {
    if (tariff.kind === 'flat') return '';
    return tariff.offPeakSlots.map(slot => `${slot.start} → ${slot.end}`).join(', ');
}
