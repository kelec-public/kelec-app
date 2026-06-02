import AsyncStorage from '@react-native-async-storage/async-storage';

export const generateMockJwt = (payload, expiresInSeconds = 3600) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const body = btoa(JSON.stringify({ ...payload, exp }));
    const signature = 'mock-signature';

    return `${header}.${body}.${signature}`;
};

export const setTokens = async (userEmail) => {
    const jwtToken = generateMockJwt({});
    const refresh_token = "refreshToken"
    const personId = "personId"
    const mockOIDC = {
        access_token: jwtToken,
        expires_in: 3600,
        id_token: jwtToken,
        refresh_token: refresh_token,
        token_type: "access_token",
        email: userEmail,
        personId: personId
    }

    await AsyncStorage.setItem(`${userEmail}_tokens`, JSON.stringify(mockOIDC));
};

test('required', () => {
    expect(1).toBe(1);
})