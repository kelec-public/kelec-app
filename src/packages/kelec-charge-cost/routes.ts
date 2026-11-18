/** Noms des routes des tarifs, à enregistrer dans le navigateur qui les ouvre (pages poussées, barre d'onglets masquée). */
export const TARIFF_LIST_ROUTE = 'TariffList' as const;
export const TARIFF_EDITOR_ROUTE = 'TariffEditor' as const;

/** Les tarifs sont propres à chaque voiture. */
export type TariffListRouteParams = {
    vin: string;
};

/** `tariffId` absent : nouveau tarif. */
export type TariffEditorRouteParams = {
    vin: string;
    tariffId?: string;
};
