import HvacStatus from "../models/HvacStatus";

/** Accès constructeur à la climatisation : statut (cache puis API) et commande de lancement. */
export interface HvacSource {
    /** Statut enregistré localement, null si aucun. */
    loadCachedStatus(): Promise<HvacStatus | null>;
    /** Récupère le statut, l'enregistre et le renvoie ; null si indisponible. */
    syncStatus(): Promise<HvacStatus | null>;
    /** Lance la climatisation ; renvoie false si la commande a échoué. */
    launch(temperature: number): Promise<boolean>;
}
