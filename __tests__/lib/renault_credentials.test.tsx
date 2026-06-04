import { describe } from "@jest/globals";
import { GigyaTokenFunctionResponse } from "../../src/lib/clients/carMakers/renaultClient";
import { RenaultCredentials } from "../../src/lib/clients/carMakers/renaultCredentials";
import * as SharedPlateformData from "../../src/lib/storage/sharedPlatformsData";

const generateValidJwt = (email: string, delay: number, shouldHavePayload: boolean): string => {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };
    const payload = {
        email: email,
        exp: shouldHavePayload ? Math.floor(Date.now() / 1000) + delay : undefined
    };
    const base64UrlHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const base64UrlPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${base64UrlHeader}.${base64UrlPayload}.signature`;
};

describe('jwt', () => {
    test('test valid jwt token', async () => {
        const email = "test@example.com";
        const token = generateValidJwt(email, 60 * 60, true);
        const isValid = RenaultCredentials.isJwtExpired(token);
        expect(isValid).toBe(false);
    });


    test('test expired jwt token', async () => {
        const email = "test@example.com";
        const expiredToken = generateValidJwt(email, -60 * 60, true);
        const isValid = RenaultCredentials.isJwtExpired(expiredToken);
        expect(isValid).toBe(true);
    });

    test('test no expiring jwt token', async () => {
        const email = "test@example.com";
        const expiredToken = generateValidJwt(email, -60 * 60, false);
        const isValid = RenaultCredentials.isJwtExpired(expiredToken);
        expect(isValid).toBe(false);
    });

    test('test invalid jwt token', async () => {
        const invalidToken = "invalid.jwt.token";
        const isValid = RenaultCredentials.isJwtExpired(invalidToken);
        expect(isValid).toBe(true);
    });

    test('test malformed jwt token', async () => {
        const malformedToken = "malformedtoken";
        const isValid = RenaultCredentials.isJwtExpired(malformedToken);
        expect(isValid).toBe(true);
    });

    test('empty token', async () => {
        const retreivedToken = await RenaultCredentials.getJWTStored("non_existing_email");
        expect(retreivedToken).toBeNull();
    });


    test('test storing and retrieving JWT', async () => {
        const email = "test@example.com";
        const token = generateValidJwt(email, 60 * 60, true);
        await RenaultCredentials.storeJWT(email, token);
        const retrievedToken = await RenaultCredentials.getJWTStored(email);
        expect(retrievedToken).toBe(token);
    });
})

describe('cookie value', () => {
    test('test storing and retreiving cookie value', async () => {
        const mockCookieValue: GigyaTokenFunctionResponse = {
            canLogin: true,
            cookieValue: "mock_cookie_value",
        }
        await RenaultCredentials.storeCookieValue("email", mockCookieValue);
        const retrievedCookieValue = await RenaultCredentials.getCookieValue("email");
        expect(retrievedCookieValue).toEqual(mockCookieValue);
    });

    test('test retrieving non existing cookie value', async () => {
        const retrievedCookieValue = await RenaultCredentials.getCookieValue("non_existing_email");
        expect(retrievedCookieValue).toBeNull();
    });
});


describe('get all cookie values', () => {
    test('no cookies to collect', async () => {
        const emails = ["email1", "email2"];
        const cookieValues = await RenaultCredentials.getAllCookieValues(emails);
        expect(cookieValues).toEqual({});
    });

    test('collecting multiple cookie values', async () => {
        const email1 = "email1";
        const email2 = "email2";
        const mockCookieValue1: GigyaTokenFunctionResponse = {
            canLogin: true,
            cookieValue: "mock_cookie_value_1",
        }
        const mockCookieValue2: GigyaTokenFunctionResponse = {
            canLogin: false,
            cookieValue: "mock_cookie_value_2",
        }
        await RenaultCredentials.storeCookieValue(email1, mockCookieValue1);
        await RenaultCredentials.storeCookieValue(email2, mockCookieValue2);

        const cookieValues = await RenaultCredentials.getAllCookieValues([email1, email2]);
        expect(cookieValues).toEqual({
            [email1]: mockCookieValue1,
            [email2]: mockCookieValue2,
        });
    });

    test('collecting cookie values with duplicate emails', async () => {
        const email1 = "email1";
        const mockCookieValue1: GigyaTokenFunctionResponse = {
            canLogin: true,
            cookieValue: "mock_cookie_value_1",
        }
        await RenaultCredentials.storeCookieValue(email1, mockCookieValue1);

        const cookieValues = await RenaultCredentials.getAllCookieValues([email1, email1]);
        expect(cookieValues).toEqual({
            [email1]: mockCookieValue1,
        });
    });
});

describe('clear credentials', () => {
    test('clear credentials for an email', async () => {
        const email = "email";
        const token = generateValidJwt(email, 60 * 60, true);
        const mockCookieValue: GigyaTokenFunctionResponse = {
            canLogin: true,
            cookieValue: "mock_cookie_value",
        }
        await RenaultCredentials.storeJWT(email, token);
        await RenaultCredentials.storeCookieValue(email, mockCookieValue);

        await RenaultCredentials.clearCredentials(email);

        const retrievedToken = await RenaultCredentials.getJWTStored(email);
        const retrievedCookieValue = await RenaultCredentials.getCookieValue(email);
        expect(retrievedToken).toBeNull();
        expect(retrievedCookieValue).toBeNull();
    });
});