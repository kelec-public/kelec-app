import 'react-native-get-random-values';
import { OIDC_CONFIG } from "./oidc-conf";
import { getNativeCryptedData, setNativeCryptedData } from '../../../lib/storage/sharedPlatformsData';

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

    static exchangeToken = async (
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
            throw new Error(`Token exchange failed: ${res.status}`);
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
            throw new Error(`User info fetch failed: ${res_user.status}`);
        }

        const parsedUserResponse = await res_user.json();

        return {
            ...parsedResponse,
            email: parsedUserResponse.email,
            personId: parsedUserResponse.personId,
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