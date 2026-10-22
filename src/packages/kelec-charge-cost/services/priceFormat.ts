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

/** Symbole court de la devise (« € », « £ », « kr ») : en français, le symbole normal de la livre est « £GB ». */
export function currencySymbol(currency: Currency): string {
    // Hermes n'a pas `formatToParts` : on formate 0 et on retire le chiffre et les espaces
    const symbol = (currencyDisplay: 'narrowSymbol' | 'symbol') => new Intl.NumberFormat(undefined, {
        style: 'currency', currency, currencyDisplay, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(0).replace(/[0\s]/g, '') || currency;
    try {
        return symbol('narrowSymbol');
    } catch {
        // moteur sans `narrowSymbol`
        return symbol('symbol');
    }
}

/** Prix au kWh sans la devise, de 2 à 4 décimales (« 0,14 », « 0,2516 ») : la devise est affichée à part. */
export function formatKwhPrice(price: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(price);
}
