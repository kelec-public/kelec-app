/** Une ligne de la première feuille du fichier : valeurs des cellules indexées par l'en-tête de colonne. */
export type SpreadsheetRow = {
    /** Numéro de la ligne dans le tableur (1 = en-têtes), pour le signaler à l'utilisateur. */
    line: number;
    /** Texte, nombre, booléen ou date (cellule au format date si le fichier a été modifié dans un tableur). */
    cells: Record<string, unknown>;
};
