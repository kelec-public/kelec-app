import Charge from "../models/Charge";

/** D'où viennent les charges d'une voiture : cache local puis API du constructeur. */
export interface ChargesSource {
    /** Charges enregistrées localement, null si aucune. */
    loadCached(): Promise<Charge[] | null>;
    /** Récupère les nouvelles charges, les enregistre et renvoie l'historique complet ; null si rien n'a pu être récupéré. */
    syncFromNetwork(): Promise<Charge[] | null>;
}
