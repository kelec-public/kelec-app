import { useContext, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import { createLoginSource } from "../services/createLoginSource";
import { isDemoCredentials } from "../services/sources/demoLoginSource";

type Params = {
    carMaker: CarMaker;
    onLoggedIn: (account: Account) => void;
    onTfaRequired: (regToken: string) => void;
};

/** Écran identifiants : saisie, connexion au compte constructeur (ou démo), erreurs. */
export function useCredentialsController({ carMaker, onLoggedIn, onTfaRequired }: Params) {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /** Renvoie true si la connexion a réussi (pour valider l'autoremplissage du système). */
    const submit = async (): Promise<boolean> => {
        setIsLoading(true);
        const source = createLoginSource(isDemoCredentials(email, password) ? CarMaker.DEMO : carMaker);
        const result = await source.authenticate(email, password);
        setIsLoading(false);

        switch (result.status) {
            case 'ok':
                onLoggedIn(result.account);
                return true;
            case 'tfa':
                onTfaRequired(result.regToken);
                return false;
            case 'error':
                Alert.alert(
                    t('error'),
                    result.messageKey ? t(result.messageKey) : '',
                    [{ text: t('ok') }],
                );
                return false;
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        canSubmit: email.length > 0 && password.length > 0,
        submit,
    };
}
