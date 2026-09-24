import { CarLocation } from "../models/CarLocation";

/** Position de la voiture selon le constructeur : cache local puis API. */
export interface LocationSource {
    /** Position enregistrée localement, null si aucune. */
    loadCached(): Promise<CarLocation | null>;
    /** Récupère la position, l'enregistre et la renvoie ; null si indisponible. */
    syncFromNetwork(): Promise<CarLocation | null>;
}
