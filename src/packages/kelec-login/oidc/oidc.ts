import 'react-native-get-random-values';
import { OIDC_CONFIG } from "./oidc-conf";
import { getNativeCryptedData, setNativeCryptedData } from '../../../lib/storage/sharedPlatformsData';
import ApiError, { ApiErrorEnum } from '../../../lib/clients/carMakers/error/apiError';

export interface OidcTokens {
    access_token: string;
    expires_in: number;
    id_token: string;
    refresh_token: string;
    token_type: string;
    email: string;
    personId: string;
}

export default class OIDC {
    static generateRandomString(length = 64): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => chars[b % chars.length]).join('');
    }

    static readonly exchangeToken = async (
        code: string,
        verifier: string
    ): Promise<OidcTokens> => {
        const res = await fetch(OIDC_CONFIG.ENDPOINT_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: OIDC_CONFIG.CLIENT_ID,
                code,
                redirect_uri: OIDC_CONFIG.REDIRECT_URI,
                code_verifier: verifier,
            }).toString(),
        });

        if (!res.ok) {
            throw new ApiError(ApiErrorEnum.TOKEN_EXCHANGE_FAILED);
        }

        const parsedResponse = await res.json() as OidcTokens;

        // on récupère les infos de l'utilisateur
        const res_user = await fetch(OIDC_CONFIG.ENDPOINT_USERINFO, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${parsedResponse.access_token}`,
            },
        });

        if (!res_user.ok) {
            throw new ApiError(ApiErrorEnum.USER_INFO_FETCH_FAILED);
        }

        const parsedUserResponse = await res_user.json();

        return {
            ...parsedResponse,
            email: parsedUserResponse.email,
            personId: parsedUserResponse.personId,
        };
    };

    static readonly refreshTokens = async (oidcTokens: OidcTokens): Promise<OidcTokens> => {
        const res = await fetch(OIDC_CONFIG.ENDPOINT_TOKEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: oidcTokens.refresh_token,
                scope: 'openid email personId lang renaultGroupFull',
                redirect_uri: OIDC_CONFIG.REDIRECT_URI,
                client_id: OIDC_CONFIG.CLIENT_ID,
                grant_type: 'refresh_token',
            }).toString(),
        });

        if (!res.ok) {
            throw new ApiError(ApiErrorEnum.TOKEN_REFRESH_FAILED);
        }

        const parsedResponse = await res.json() as OidcTokens;

        return {
            ...parsedResponse,
            email: oidcTokens.email,
            personId: oidcTokens.personId,
        };
    };

    static async saveTokens(tokens: OidcTokens): Promise<void> {
        const email = tokens.email;
        await setNativeCryptedData(`${email}_tokens`, JSON.stringify(tokens));
    }

    static async getTokens(email: string): Promise<OidcTokens | null> {
        const tokensString = await getNativeCryptedData(`${email}_tokens`);
        if (!tokensString) {
            return null;
        }
        const parsedTokens = JSON.parse(tokensString) as OidcTokens;

        // TODO: vérifier si expiré et refresh si besoin
        return parsedTokens;
    }
}