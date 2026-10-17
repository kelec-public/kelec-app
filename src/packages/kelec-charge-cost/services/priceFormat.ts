import { Currency, parseLocalDate } from "../models/Tariff";

/** Montant dans la devise, au format du téléphone (« 3,42 € », « £3.42 », « 34,20 kr »). */
export function formatPrice(amount: number, currency: Currency, maximumFractionDigits = 2): string {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: Math.min(2, maximumFractionDigits),
        maximumFractionDigits,
    }).format(amount);
}

/** Prix au kWh : jusqu'à 4 décimales (ex. 0,2516 €). */
export function formatPricePerKwh(price: number, currency: Currency): string {
    return `${formatPrice(price, currency, 4)}/kWh`;
}

/** Date locale « AAAA-MM-JJ » au format du téléphone. */
export function formatLocalDate(value: string): string {
    return parseLocalDate(value).toLocaleDateString();
}
