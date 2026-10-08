import XLSX from 'xlsx';
import { SpreadsheetRow } from "../models/SpreadsheetRow";

/**
 * Lit la première feuille d'un fichier xlsx (contenu en base64).
 * Les colonnes sont repérées par leur en-tête : leur ordre a changé selon les versions de l'export.
 * Lève une erreur si le fichier ne contient aucune ligne : xlsx lit n'importe quel fichier
 * (pdf, image…) comme une feuille vide plutôt que d'échouer.
 */
export const readSpreadsheetRows = (base64: string): SpreadsheetRow[] => {
    const workbook = XLSX.read(base64, { type: 'base64', cellDates: true });
    const [firstSheet] = workbook.SheetNames;
    const rows = firstSheet === undefined
        ? []
        : XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { raw: true });
    if (rows.length === 0) {
        throw new Error('Le fichier ne contient aucune ligne');
    }

    // `__rowNum__` (non énumérable, à partir de 0) garde le vrai numéro de ligne malgré les lignes vides ignorées.
    return rows.map((cells, index) => {
        const rowIndex = (cells as { __rowNum__?: number }).__rowNum__ ?? index + 1;
        return { line: rowIndex + 1, cells };
    });
};
