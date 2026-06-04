import { GigyaTokenFunctionResponse } from "./renaultClient";
import { clearNativeCryptedData, getNativeCryptedData, setNativeCryptedData } from "../../storage/sharedPlatformsData";


class RenaultCredentials {

    /**
     * Checks if a JWT token is expired.
     * @param {string} token - The JWT token to check.
     * @returns {boolean} Returns true if the token is expired, false if not expired or if there's no expiration.
     */
    static readonly isJwtExpired = (token: string): boolean => {
        try {
            // Split the token into parts
            const parts = token.split('.');
            if (parts.length !== 3) {
                return true; // Invalid JWT format
            }

            // Decode the payload part (base64url)
            const payload = parts[1];
            const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            const parsedPayload = JSON.parse(decodedPayload);

            // Check if the token has an expiration claim
            if (typeof parsedPayload.exp === 'undefined') {
                return false; // No expiration date, so not expired
            }

            // Compare expiration time with current time
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
            return parsedPayload.exp < currentTime;
        } catch (error) {
            return true; // If there's an error, assume expired
        }
    }

    /**
     * Checks if a JWT valid token is stored.
     */
    static readonly getJWTStored = async (email: string): Promise<string | null> => {
        const storedToken = await getNativeCryptedData(`jwt_${email}`);
        if (storedToken && !RenaultCredentials.isJwtExpired(storedToken)) {
            return storedToken;
        }
        return null; // Token is either expired or not found
    }

    /**
     * Stores a JWT token
     */
    static readonly storeJWT = async (email: string, token: string): Promise<void> => {
        await setNativeCryptedData(`jwt_${email}`, token);
    }

    static readonly getCookieValue = async (email: string): Promise<GigyaTokenFunctionResponse | null> => {
        const storedValue = await getNativeCryptedData(`cookieValue_${email}`);
        if (storedValue) {
            return JSON.parse(storedValue);
        }

        return null;
    }

    /**
     * Collect 
     * @param email all emails on the app
     * @returns a record of cookie values associated to emails
     */
    static readonly getAllCookieValues = async (email: string[]): Promise<Record<string, GigyaTokenFunctionResponse>> => {
        const uniqueEmails = email.filter((value, index, self) => self.indexOf(value) === index);
        const cookieValues: Record<string, GigyaTokenFunctionResponse> = {};

        for (const email of uniqueEmails) {
            const cookieValue = await RenaultCredentials.getCookieValue(email);
            if (cookieValue) {
                cookieValues[email] = cookieValue;
            }
        }

        return cookieValues;
    }

    static readonly storeCookieValue = async (email: string, cookieValue: GigyaTokenFunctionResponse): Promise<void> => {
        await setNativeCryptedData(`cookieValue_${email}`, JSON.stringify(cookieValue));
    }

    static readonly clearCredentials = async (email: string): Promise<void> => {
        await clearNativeCryptedData(`jwt_${email}`);
        await clearNativeCryptedData(`cookieValue_${email}`);
    }
}


export { RenaultCredentials };