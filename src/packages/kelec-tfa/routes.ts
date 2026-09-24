/** Route de l'écran TFA, à enregistrer dans chaque navigateur qui peut le déclencher. */
export const TFA_ROUTE = 'TfaView' as const;

export type TfaRouteParams = {
    regToken: string;
    /** Clé de traduction du message affiché une fois le TFA validé (dépend de l'écran appelant). */
    successMessageKey: string;
};
