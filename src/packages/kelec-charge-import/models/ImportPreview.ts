import { Charge } from "../../kelec-charge-history";

/** Résultat de la lecture d'un fichier, avant enregistrement. */
export type ImportPreview = {
    /** Charges du fichier absentes de l'historique : ce sont elles qui seront ajoutées. */
    newCharges: Charge[];
    /** Nombre de charges du fichier déjà présentes dans l'historique (même début, à quelques secondes près). */
    alreadyKnownCount: number;
    /** Numéros des lignes du fichier qui n'ont pas pu être lues. */
    rejectedLines: number[];
};

/** Un total avant et après l'import. */
export type BeforeAfter = {
    before: number;
    after: number;
};

/** Totaux de l'historique avant / après l'import, pour l'aperçu. */
export type ImportSummary = {
    charges: BeforeAfter;
    energyKwh: BeforeAfter;
    minutes: BeforeAfter;
};
