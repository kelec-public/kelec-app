import { startTfa, validateTfa } from "../../../src/packages/kelec-tfa/services/tfaSequence";

const makeClient = () => {
    const calls: string[] = [];
    const step = (name: string, result?: unknown) => jest.fn(async () => { calls.push(name); return result; });
    return {
        calls,
        client: {
            getDeviceId: step('getDeviceId'),
            initTfaSequence: step('initTfaSequence'),
            getTfaEmails: step('getTfaEmails', { obfuscated: 'j***@x.fr' }),
            sendTfaCode: step('sendTfaCode'),
            validateTfaCode: step('validateTfaCode'),
            finalizeTfa: step('finalizeTfa'),
            finalizeRegistration: step('finalizeRegistration'),
        } as any,
    };
};

test('startTfa : appareil, séquence, emails puis envoi du code', async () => {
    const { client, calls } = makeClient();
    expect(await startTfa(client)).toEqual({ obfuscated: 'j***@x.fr' });
    expect(calls).toEqual(['getDeviceId', 'initTfaSequence', 'getTfaEmails', 'sendTfaCode']);
});

test('validateTfa : code, finalisation du TFA puis de l\'enregistrement', async () => {
    const { client, calls } = makeClient();
    await validateTfa(client, '123456');
    expect(client.validateTfaCode).toHaveBeenCalledWith('123456');
    expect(calls).toEqual(['validateTfaCode', 'finalizeTfa', 'finalizeRegistration']);
});

test('une étape en échec arrête la suite', async () => {
    const { client, calls } = makeClient();
    client.validateTfaCode.mockRejectedValueOnce(new Error('WRONG_VERIFICATION_CODE'));
    await expect(validateTfa(client, '000000')).rejects.toThrow('WRONG_VERIFICATION_CODE');
    expect(calls).not.toContain('finalizeTfa');
});
