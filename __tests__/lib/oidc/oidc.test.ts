import ApiError, { ApiErrorEnum } from "../../../src/lib/clients/carMakers/error/apiError";
import OIDC, { OidcTokens } from "../../../src/packages/kelec-login/oidc/oidc";
import { generateMockJwt } from "../clients/renault/renaultHelpers";


describe('generate random string', () => {
    it('should generate a random string of the specified length', () => {
        const length = 16;
        const randomString = OIDC.generateRandomString(length);
        expect(randomString).toHaveLength(length);
    });

    it('should generate different random strings on subsequent calls', () => {
        const length = 16;
        const randomString1 = OIDC.generateRandomString(length);
        const randomString2 = OIDC.generateRandomString(length);
        expect(randomString1).not.toBe(randomString2);
    });
});

describe('refreshToken', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should refrsh token', async () => {
        const userEmail = "email@email.com";
        const personId = "personId";

        const jwt_token = generateMockJwt({ status: 'old' }, 3600);
        const mockOIDC: OidcTokens = {
            access_token: jwt_token,
            expires_in: 3600,
            id_token: jwt_token,
            refresh_token: jwt_token,
            token_type: "access_token",
            email: userEmail,
            personId: personId
        };

        const new_jwt_token = generateMockJwt({ status: 'new' }, 3600);
        const mockNewOidc: OidcTokens = {
            access_token: new_jwt_token,
            expires_in: 3600,
            id_token: new_jwt_token,
            refresh_token: new_jwt_token,
            token_type: "access_token",
            email: userEmail,
            personId: personId
        }

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(mockNewOidc)
        });

        const refreshedTokens = await OIDC.refreshTokens(mockOIDC);
        expect(refreshedTokens).toEqual(mockNewOidc);
    });

    it('should throw an error if the refresh token request fails', async () => {
        const userEmail = "email@email.com";
        const personId = "personId";

        const jwt_token = generateMockJwt({ status: 'old' }, 3600);
        const mockOIDC: OidcTokens = {
            access_token: jwt_token,
            expires_in: 3600,
            id_token: jwt_token,
            refresh_token: jwt_token,
            token_type: "access_token",
            email: userEmail,
            personId: personId
        };

        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
        });

        try {
            await OIDC.refreshTokens(mockOIDC);
            expect(true).toBe(false); // This line should not be reached
        } catch (e) {
            const expectedError = new ApiError(ApiErrorEnum.TOKEN_REFRESH_FAILED);
            expect(e).toEqual(expectedError);
        }
    });
});

describe('exchangeToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('should throw error for token endpoint', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
        });

        try {
            await OIDC.exchangeToken("code", "verifier");
            expect(true).toBe(false); // This line should not be reached
        } catch (e) {
            const expectedError = new ApiError(ApiErrorEnum.TOKEN_EXCHANGE_FAILED);
            expect(e).toEqual(expectedError);
        }
    });

    it('should throw error for user info endpoint', async () => {
        const jwt_token = generateMockJwt({ status: 'old' }, 3600);
        const mockOidcTokens: OidcTokens = {
            access_token: jwt_token,
            expires_in: 3600,
            id_token: jwt_token,
            refresh_token: jwt_token,
            token_type: "access_token",
            email: "",
            personId: ""
        };

        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockOidcTokens)
            })
            .mockResolvedValueOnce({
                ok: false,
            });

        try {
            await OIDC.exchangeToken("code", "verifier");
            expect(true).toBe(false); // This line should not be reached
        } catch (e) {
            const expectedError = new ApiError(ApiErrorEnum.USER_INFO_FETCH_FAILED);
            expect(e).toEqual(expectedError);
        }
    });

    it('should exchange token and fetch user info successfully', async () => {
        const userEmail = "email@email.com";
        const personId = "personId";

        const jwt_token = generateMockJwt({ status: 'old' }, 3600);
        const mockOidcTokens: OidcTokens = {
            access_token: jwt_token,
            expires_in: 3600,
            id_token: jwt_token,
            refresh_token: jwt_token,
            token_type: "access_token",
            email: "",
            personId: ""
        };

        const mockUserInfoResponse = {
            email: userEmail,
            personId: personId
        };

        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockOidcTokens)
            })
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockUserInfoResponse)
            });

        const result = await OIDC.exchangeToken("code", "verifier");
        expect(result).toEqual({
            ...mockOidcTokens,
            email: userEmail,
            personId: personId
        });
    });

});