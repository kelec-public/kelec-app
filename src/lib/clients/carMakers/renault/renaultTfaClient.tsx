import Config from 'react-native-config';
import { TfaCompleteVerificationApiResponse, TfaEmail, TfaEmailApiReponse, TfaInitApiResponse, TfaSendVerificationApiResponse } from './renaultTfaModels';

enum RenaultTfaEndpoints {
    GET_SDK_BOOTSTRAP = '/accounts.webSdkBootstrap',
    INIT_TFA = '/accounts.tfa.initTFA',
    GET_TFA_EMAILS = '/accounts.tfa.email.getEmails',
    SEND_EMAIL_CODE = '/accounts.tfa.email.sendVerificationCode',
    COMPLETE_EMAIL_VERIFICATION = '/accounts.tfa.email.completeVerification',
    FINALIZE_TFA = '/accounts.tfa.finalizeTFA',
    FINALIZE_REGISTRATION = '/accounts.finalizeRegistration',

}

export enum TFA_ERRORS {
    WRONG_VERIFICATION_CODE = 'Wrong verification code',
    MAXIMUM_VERIFICATION_EXCEEDED = 'Maximum allowed tries exceeded'
}

class RenaultTfaClient {
    private static readonly GIGYA_URL = 'https://gigya-prod-eu1.renaultgroup.com';
    private static readonly GIGYA_API_KEY = Config.GIGYA_API_KEY ?? '';

    private readonly regToken: string;
    private deviceId: string = '';
    private gigyaAssertion: string = '';
    private tfaEmail: TfaEmail | null = null;
    private phvToken: string = '';
    private providerAssertion: string = '';

    constructor(regToken: string) {
        this.regToken = regToken;
    }

    public getDeviceId = async (): Promise<void> => {
        const urlParams = new URLSearchParams({
            apiKey: RenaultTfaClient.GIGYA_API_KEY,
        })
        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.GET_SDK_BOOTSTRAP}?${urlParams.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Failed to get device ID: ${response.statusText}`);
        }

        let deviceId = null;
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
            cookies.split(',').forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.trim().split('=');
                if (name === 'gmid') {
                    deviceId = value;
                }
            });
        }

        if (!deviceId) {
            throw new Error('Device ID not found in response cookies');
        }

        this.deviceId = deviceId;
    };

    public initTfaSequence = async (): Promise<void> => {
        const urlParams = new URLSearchParams({
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
            regToken: this.regToken,
            provider: 'gigyaEmail',
            mode: 'verify'
        });
        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.INIT_TFA}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to init TFA sequence: ${response.statusText}`);
        }

        const data = await response.json() as TfaInitApiResponse;

        if (data.statusCode !== 200 || !data.gigyaAssertion) {
            throw new Error(`TFA init failed: ${data.errorDetails ?? 'Unknown error'}`);
        }

        this.gigyaAssertion = data.gigyaAssertion;
    };

    public getTfaEmails = async (): Promise<TfaEmail> => {
        const urlParams = new URLSearchParams({
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
            gigyaAssertion: this.gigyaAssertion,
        })

        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.GET_TFA_EMAILS}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get TFA emails: ${response.statusText}`);
        }

        const data = await response.json() as TfaEmailApiReponse;

        if (data.statusCode !== 200 || !data.emails) {
            throw new Error(`Get TFA emails failed: ${data.errorDetails ?? 'Unknown error'}`);
        }

        if (data.emails.length === 0) {
            throw new Error('No TFA emails found for this account');
        }

        this.tfaEmail = data.emails[0];
        return data.emails[0];
    };

    public sendTfaCode = async (): Promise<void> => {
        const urlParams = new URLSearchParams({
            emailID: this.tfaEmail?.id ?? '',
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
            gigyaAssertion: this.gigyaAssertion,
        })

        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.SEND_EMAIL_CODE}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to send TFA code: ${response.statusText}`);
        }

        const data = await response.json() as TfaSendVerificationApiResponse;

        if (data.statusCode !== 200 || !data.phvToken) {
            throw new Error(`Send TFA code failed: ${data.errorDetails ?? 'Unknown error'}`);
        }

        this.phvToken = data.phvToken;
    };

    public validateTfaCode = async (code: string): Promise<void> => {
        const urlParams = new URLSearchParams({
            gigyaAssertion: this.gigyaAssertion,
            phvToken: this.phvToken,
            code: code,
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
        })

        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.COMPLETE_EMAIL_VERIFICATION}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });


        if (!response.ok) {
            throw new Error(`Failed to validate TFA code: ${response.statusText}`);
        }

        const data = await response.json() as TfaCompleteVerificationApiResponse;

        if (data.statusCode !== 200 || !data.providerAssertion) {
            throw new Error(`${data.errorDetails}`);
        }

        this.providerAssertion = data.providerAssertion;
    }

    public finalizeTfa = async (): Promise<void> => {
        const urlParams = new URLSearchParams({
            gigyaAssertion: this.gigyaAssertion,
            providerAssertion: this.providerAssertion,
            regToken: this.regToken,
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
        })

        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.FINALIZE_TFA}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to finalize TFA: ${response.statusText}`);
        }

        const data = await response.json() as TfaCompleteVerificationApiResponse;

        if (data.statusCode !== 200) {
            throw new Error(`Finalize TFA failed: ${data.errorDetails ?? 'Unknown error'}`);
        }
    };

    public finalizeRegistration = async (): Promise<void> => {
        const urlParams = new URLSearchParams({
            regToken: this.regToken,
            include: 'profile,data',
            includeUserInfo: 'true',
            APIKey: RenaultTfaClient.GIGYA_API_KEY,
        });

        const response = await fetch(`${RenaultTfaClient.GIGYA_URL}${RenaultTfaEndpoints.FINALIZE_REGISTRATION}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Cookie': `gmid=${this.deviceId}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to finalize registration: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.statusCode !== 200) {
            throw new Error(`Finalize registration failed: ${data.errorDetails ?? 'Unknown error'}`);
        }
    }
};

export default RenaultTfaClient;