import { CarMakerClientErrors } from "../../../lib/clients/carMakers/carMakerClient";

/** Clé de traduction du message à afficher pour une erreur de connexion Renault ('' si inconnue). */
export const loginErrorMessageKey = (error: string | undefined): string => {
    switch (error) {
        case CarMakerClientErrors.SERVER_ERROR:
            return 'serverError';
        case CarMakerClientErrors.ACCOUNT_LOCKED:
            return 'accountLocked';
        case CarMakerClientErrors.INVALID_CREDENTIALS:
            return 'invalidPassWord';
        default:
            return '';
    }
};
