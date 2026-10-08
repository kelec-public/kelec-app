import { Charge, KnownChargeStarts } from "../../kelec-charge-history";
import { ImportPreview, ImportSummary } from "../models/ImportPreview";
import { SpreadsheetRow } from "../models/SpreadsheetRow";
import { createDateParser, DateOrder } from "./dateFormat";
import { DATE_COLUMNS, parseChargeRow } from "./rowParser";

/**
 * Lit les lignes du fichier et les compare à l'historique : seules les charges dont le début
 * n'y est pas encore (ni plus haut dans le fichier, à quelques secondes près) seront ajoutées.
 */
export const buildImportPreview = (
    rows: SpreadsheetRow[],
    existing: Charge[],
    fallbackDateOrder?: DateOrder,
): ImportPreview => {
    const dateSamples = rows.flatMap(({ cells }) => DATE_COLUMNS.map(column => cells[column]));
    const parseDate = createDateParser(dateSamples, fallbackDateOrder);

    const knownStarts = new KnownChargeStarts(existing);
    const preview: ImportPreview = { newCharges: [], alreadyKnownCount: 0, rejectedLines: [] };

    for (const row of rows) {
        const charge = parseChargeRow(row, parseDate);
        if (charge === null) {
            preview.rejectedLines.push(row.line);
            continue;
        }

        if (knownStarts.has(charge)) {
            preview.alreadyKnownCount++;
            continue;
        }
        knownStarts.add(charge);
        preview.newCharges.push(charge);
    }
    return preview;
};

const totalEnergy = (charges: Charge[]): number =>
    charges.reduce((sum, charge) => sum + charge.getEnergyRecovered(), 0);

const totalMinutes = (charges: Charge[]): number =>
    charges.reduce((sum, charge) => sum + charge.getDurationInMinutes(), 0);

const roundKwh = (kwh: number): number => parseFloat(kwh.toFixed(2));

/** Totaux de l'historique avant et après l'ajout des nouvelles charges. */
export const summarizeImport = (existing: Charge[], preview: ImportPreview): ImportSummary => {
    const energyBefore = totalEnergy(existing);
    const minutesBefore = totalMinutes(existing);
    return {
        charges: { before: existing.length, after: existing.length + preview.newCharges.length },
        energyKwh: { before: roundKwh(energyBefore), after: roundKwh(energyBefore + totalEnergy(preview.newCharges)) },
        minutes: { before: minutesBefore, after: minutesBefore + totalMinutes(preview.newCharges) },
    };
};
