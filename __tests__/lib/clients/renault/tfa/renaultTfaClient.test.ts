import { describe, it } from '@jest/globals';
import RenaultTfaClient from '../../../../../src/lib/clients/carMakers/renault/renaultTfaClient';
const renaultTfaClient = new RenaultTfaClient('testRegToken');

const MethodsToTest = [
    renaultTfaClient.getDeviceId,
    renaultTfaClient.initTfaSequence,
    renaultTfaClient.getTfaEmails,
    renaultTfaClient.sendTfaCode,
    renaultTfaClient.validateTfaCode,
    renaultTfaClient.finalizeTfa,
    renaultTfaClient.finalizeRegistration
]
describe('throw error in case of fetch failure', () => {

    MethodsToTest.forEach(method => {
        it(`should throw error if fetch fails in ${method.name}`, async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(method()).rejects.toThrow();
        });

        it(`should throw if response code is not 200 in ${method.name}`, async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    statusCode: 400,
                    errorDetails: 'Some error'
                })
            });

            await expect(method()).rejects.toThrow();
        });
    });
});

describe('getDeviceId', () => {
    it('should set device id on successful response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue('gmid=testDeviceId; othercookie=value')
            }
        });

        await renaultTfaClient.getDeviceId();
        expect((renaultTfaClient as any).deviceId).toBe('testDeviceId');
    });


    it('should throw error if set-cookie header is missing', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue(null)
            }
        });

        await expect(renaultTfaClient.getDeviceId()).rejects.toThrow('Device ID not found in response cookies');
    });

    it('should throw error if device ID is not found in cookies', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue('othercookie=value')
            }
        });

        await expect(renaultTfaClient.getDeviceId()).rejects.toThrow('Device ID not found in response cookies');
    });
});

describe('initTfaSequence', () => {
    it('should set gigya assertion on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
                gigyaAssertion: 'testGigyaAssertion'
            })
        });

        await renaultTfaClient.initTfaSequence();
        expect((renaultTfaClient as any).gigyaAssertion).toBe('testGigyaAssertion');
    });

    it('should throw error if gigya assertion is missing', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
            })
        });

        await expect(renaultTfaClient.initTfaSequence()).rejects.toThrow('TFA init failed: Unknown error');
    });
});

describe('getTfaEmails', () => {
    it('should return TFA email on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
                emails: [{ id: 'email1', obfuscated: 'test@example.com' }]
            })
        });

        const emails = await renaultTfaClient.getTfaEmails();
        expect(emails).toEqual({ id: 'email1', obfuscated: 'test@example.com' });
    });

    it('should throw error if emails array is empty', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
                emails: []
            })
        });

        await expect(renaultTfaClient.getTfaEmails()).rejects.toThrow('No TFA emails found for this account');
    });
});

describe('sendTfaCode', () => {
    it('should set phvToken on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).tfaEmail = { id: 'email1', obfuscated: 'email', lastVerification: '2024-01-01T00:00:00Z' };
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
                phvToken: 'testPhvToken'
            })
        });

        await renaultTfaClient.sendTfaCode();
        expect((renaultTfaClient as any).phvToken).toBe('testPhvToken');
    });

    it('should throw error if phvToken is missing', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).tfaEmail = { id: 'email1', obfuscated: 'email', lastVerification: '2024-01-01T00:00:00Z' };
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
            })
        });

        await expect(renaultTfaClient.sendTfaCode()).rejects.toThrow('Send TFA code failed: Unknown error');
    });
});

describe('validateTfaCode', () => {
    it('should set provider assertion on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).phvToken = 'testPhvToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
                providerAssertion: 'testProviderAssertion'
            })
        });

        await renaultTfaClient.validateTfaCode('123456');
        expect((renaultTfaClient as any).providerAssertion).toBe('testProviderAssertion');
    });

    it('should throw error if provider assertion is missing', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).phvToken = 'testPhvToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
            })
        });

        await expect(renaultTfaClient.validateTfaCode('123456')).rejects.toThrow();
    });
});


describe('finalizeTfa', () => {
    it('should finalize TFA on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).providerAssertion = 'testProviderAssertion';
        (renaultTfaClient as any).regToken = 'testRegToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
            })
        });

        await expect(renaultTfaClient.finalizeTfa()).resolves.not.toThrow();
    });

    it('should throw error if status code is not 200', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).gigyaAssertion = 'testGigyaAssertion';
        (renaultTfaClient as any).providerAssertion = 'testProviderAssertion';
        (renaultTfaClient as any).regToken = 'testRegToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 400,
                errorDetails: 'Some error'
            })
        });

        await expect(renaultTfaClient.finalizeTfa()).rejects.toThrow('Finalize TFA failed: Some error');
    });
});

describe('finalizeRegistration', () => {
    it('should finalize registration on successful response', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).regToken = 'testRegToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 200,
            })
        });

        await expect(renaultTfaClient.finalizeRegistration()).resolves.not.toThrow();
    });

    it('should throw error if status code is not 200', async () => {
        (renaultTfaClient as any).deviceId = 'testDeviceId';
        (renaultTfaClient as any).regToken = 'testRegToken';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                statusCode: 400,
                errorDetails: 'Some error'
            })
        });

        await expect(renaultTfaClient.finalizeRegistration()).rejects.toThrow('Finalize registration failed: Some error');
    });
});