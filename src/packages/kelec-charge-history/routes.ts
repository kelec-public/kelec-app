/** Nom de la route de l'écran d'historique, à enregistrer dans le navigateur de la page voiture. */
export const CHARGES_HISTORY_ROUTE = 'ChargesView' as const;

/** Page de modification du prix d'une charge. La charge est retrouvée par son début (sérialisable). */
export const CHARGE_COST_ROUTE = 'ChargeCost' as const;

export type ChargeCostRouteParams = {
    chargeStartDate: string;
};
