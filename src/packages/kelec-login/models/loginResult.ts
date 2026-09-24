import Account from "../../../lib/clients/accounts/account";

/** Résultat d'une connexion au compte constructeur. */
export type LoginResult =
    | { status: 'ok'; account: Account }
    /** Renault : vérification en deux étapes à faire (kelec-tfa). */
    | { status: 'tfa'; regToken: string }
    /** Message à afficher : clé de traduction. */
    | { status: 'error'; messageKey: string };
