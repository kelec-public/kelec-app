import { Edge } from "react-native-safe-area-context";

/** Route du formulaire du modèle de la voiture, à enregistrer dans chaque navigateur qui l'ouvre. */
export const CAR_TYPE_ROUTE = 'CarModelSelector' as const;

/** Paramètres sérialisables (pas d'objet CarModel ni de callback : l'action de fin est une prop de l'écran). */
export type CarTypeRouteParams = {
    vin: string;
    imageUrl: string;
    /** Clés de traduction. */
    titleKey: string;
    subTitleKey?: string;
    nextButtonTextKey?: string;
    safeAreaEdges?: Edge[];
};
