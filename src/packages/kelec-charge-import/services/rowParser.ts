import { Charge } from "../../kelec-charge-history";
import { SpreadsheetRow } from "../models/SpreadsheetRow";
import { DateParser } from "./dateFormat";

/**
 * Colonnes lues dans le fichier : les noms des champs de `Charge`, écrits tels quels par l'export.
 * Les colonnes inconnues sont ignorées, notamment `isAMergeCharge`, `subCharges` (anciens exports,
 * cellule inutilisable) et `subChargesCount`.
 */
export const DATE_COLUMNS = ['chargeStartDate', 'chargeEndDate'] as const;

/** Nombre, ou nombre écrit en texte (virgule décimale acceptée). */
const readNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
};

/** Booléen, ou `true` / `false` écrit en texte. */
const readBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return undefined;
    const text = value.trim().toLowerCase();
    if (text === 'true') return true;
    if (text === 'false') return false;
    return undefined;
};

const readString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

/** Date au format de l'API Renault (`2024-08-23T07:57:41Z`, sans millisecondes), comme les charges déjà stockées. */
export const toApiDate = (date: Date): string => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

/**
 * Convertit une ligne du fichier en charge, ou null si une valeur indispensable manque ou est illisible
 * (dates, durée, niveaux de batterie).
 *
 * Une ligne fusionnée (export fait avec l'option de fusion) devient une charge simple :
 * le détail des sous-charges n'est pas dans le fichier.
 */
export const parseChargeRow = ({ cells }: SpreadsheetRow, parseDate: DateParser): Charge | null => {
    const start = parseDate(cells.chargeStartDate);
    const end = parseDate(cells.chargeEndDate);
    const duration = readNumber(cells.chargeDuration);
    const startLevel = readNumber(cells.chargeStartBatteryLevel);
    const endLevel = readNumber(cells.chargeEndBatteryLevel);

    if (start === null || end === null || duration === undefined || startLevel === undefined || endLevel === undefined) {
        return null;
    }

    return new Charge(
        toApiDate(start),
        toApiDate(end),
        duration,
        startLevel,
        endLevel,
        readNumber(cells.chargeEnergyRecovered),
        readString(cells.chargeEndStatus),
        false,
        [],
        readNumber(cells.mileageAtStart),
        readBoolean(cells.inaccurateMileage),
        readNumber(cells.V2GEnergyDischarged),
        readBoolean(cells.isV2G) ?? false,
    );
};
