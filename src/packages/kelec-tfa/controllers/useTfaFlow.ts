import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import RenaultTfaClient, { TFA_ERRORS } from "../../../lib/clients/carMakers/renault/renaultTfaClient";
import { TfaEmail } from "../../../lib/clients/carMakers/renault/renaultTfaModels";
import { startTfa, validateTfa } from "../services/tfaSequence";

export enum TfaStepStatus {
    LOADING,
    DONE,
    ERROR
}

export const TFA_CODE_LENGTH = 6;
/** Délai avant de pouvoir redemander un code (secondes). */
const RESEND_COOLDOWN_S = 10;

const errorMessageOf = (error: unknown): string => error instanceof Error ? error.message : 'Unknown error';

type Params = {
    regToken: string;
    successMessageKey: string;
    /** Appelé en quittant l'écran (succès, trop d'essais ou retour). */
    onExit: () => void;
};

/** Déroulé du TFA Renault : envoi du code, saisie, renvoi (avec délai), validation. */
export function useTfaFlow({ regToken, successMessageKey, onExit }: Params) {
    const { languageHandler } = useContext(MainContext);

    const clientRef = useRef<RenaultTfaClient | null>(null);
    if (!clientRef.current) {
        clientRef.current = new RenaultTfaClient(regToken);
    }

    const [status, setStatus] = useState<TfaStepStatus>(TfaStepStatus.LOADING);
    const [email, setEmail] = useState<TfaEmail | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startCooldown = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setResendCooldown(RESEND_COOLDOWN_S);
        intervalRef.current = setInterval(() => {
            setResendCooldown(previous => {
                if (previous <= 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return previous - 1;
            });
        }, 1000);
    }, []);

    const fail = (error: unknown) => {
        setErrorMessage(errorMessageOf(error));
        setStatus(TfaStepStatus.ERROR);
    };

    useEffect(() => {
        (async () => {
            setStatus(TfaStepStatus.LOADING);
            try {
                setEmail(await startTfa(clientRef.current!));
                startCooldown();
                setStatus(TfaStepStatus.DONE);
            } catch (error) {
                fail(error);
            }
        })();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const resendCode = async () => {
        setCode('');
        setStatus(TfaStepStatus.LOADING);
        try {
            await clientRef.current!.sendTfaCode();
            startCooldown();
            setStatus(TfaStepStatus.DONE);
        } catch (error) {
            fail(error);
        }
    };

    const validate = async () => {
        setIsValidating(true);
        try {
            await validateTfa(clientRef.current!, code);
        } catch (error) {
            const message = errorMessageOf(error);
            switch (message) {
                case TFA_ERRORS.WRONG_VERIFICATION_CODE:
                    Alert.alert(languageHandler.getTranslation('incorrectCode'));
                    break;
                case TFA_ERRORS.MAXIMUM_VERIFICATION_EXCEEDED:
                    Alert.alert(languageHandler.getTranslation('maximumAllowedTriesExceeded'));
                    onExit();
                    break;
                default:
                    fail(error);
            }
            setIsValidating(false);
            return;
        }

        Alert.alert(languageHandler.getTranslation(successMessageKey));
        onExit();
    };

    return {
        status,
        email,
        errorMessage,
        code,
        setCode,
        canValidate: code.length === TFA_CODE_LENGTH,
        isValidating,
        canResend: resendCooldown <= 1,
        resendCode,
        validate,
    };
}
