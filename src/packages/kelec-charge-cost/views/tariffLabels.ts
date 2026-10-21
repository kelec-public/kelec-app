import { formatLocalDate } from "../services/priceFormat";
import { tariffEnd, TariffPeriod } from "../services/tariffList";

type Translate = (key: string) => string;

/** « Depuis le début → 31/01/2027 », « À partir du 01/02/2027 ». */
export function periodLabel(tariffs: TariffPeriod[], tariff: TariffPeriod, t: Translate): string {
    const start = tariff.validFrom === null ? t("sinceTheBeginning") : `${t("fromDate")} ${formatLocalDate(tariff.validFrom)}`;
    const end = tariffEnd(tariffs, tariff.id);
    return end ? `${start} → ${formatLocalDate(end)}` : start;
}
