import HvacStatus from "../models/HvacStatus";

/** Accès constructeur à la climatisation : statut (cache puis API), commandes de lancement et d'arrêt. */
export interface HvacSource {
    /** Vrai si le constructeur permet d'arrêter la climatisation à distance. */
    readonly canStop: boolean;
    /** Statut enregistré localement, null si aucun. */
    loadCachedStatus(): Promise<HvacStatus | null>;
    /** Récupère le statut, l'enregistre et le renvoie ; null si indisponible. */
    syncStatus(): Promise<HvacStatus | null>;
    /** Lance la climatisation ; renvoie false si la commande a échoué. */
    launch(temperature: number): Promise<boolean>;
    /** Arrête la climatisation ; renvoie false si la commande a échoué ou n'est pas gérée. */
    stop(): Promise<boolean>;
}
