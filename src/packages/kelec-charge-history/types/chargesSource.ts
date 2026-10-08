import Charge from "../models/Charge";

/** D'où viennent les charges d'une voiture : cache local puis API du constructeur. */
export interface ChargesSource {
    /** Charges enregistrées localement, null si aucune. */
    loadCached(): Promise<Charge[] | null>;
    /** Récupère les nouvelles charges, les enregistre et renvoie l'historique complet ; null si rien n'a pu être récupéré. */
    syncFromNetwork(): Promise<Charge[] | null>;
    /**
     * Ajoute des charges importées à l'historique stocké (celles déjà présentes sont gardées)
     * et renvoie l'historique complet. Absent si la source ne stocke rien (ex. démo).
     */
    importCharges?(charges: Charge[]): Promise<Charge[]>;
}
