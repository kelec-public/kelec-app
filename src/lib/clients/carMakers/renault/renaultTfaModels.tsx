export type TfaInitApiResponse = {
    statusCode?: number;
    errorDetails?: string;
    gigyaAssertion?: string;
};

export type TfaEmailApiReponse = {
    statusCode?: number;
    errorDetails?: string;
    emails: TfaEmail[];
}

export type TfaEmail = {
    id: string;
    obfuscated: string;
    lastVerification: string;
}

export type TfaSendVerificationApiResponse = {
    statusCode?: number;
    errorDetails?: string;
    phvToken: string;
}
export type TfaCompleteVerificationApiResponse = {
    statusCode?: number;
    errorDetails?: string;
    providerAssertion: string;
}

export type FinalizeTfaApiResponse = {
    statusCode?: number;
    errorDetails?: string;
}