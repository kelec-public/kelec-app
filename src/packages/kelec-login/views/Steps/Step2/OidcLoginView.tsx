import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../LoginEntryView";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { OIDC_CONFIG, OIDCAuthState } from "../../../oidc/oidc-conf";
import WebView from "react-native-webview";
import { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import OIDC from "../../../oidc/oidc";
import CryptoJS from 'crypto-js';
import Account, { CarMaker } from "../../../../../lib/clients/accounts/account";
import RenaultClient from "../../../../../lib/clients/carMakers/renaultClient";
import RenaultAccount from "../../../../../lib/clients/accounts/renaultAccount";
import NewRenaultClient from "../../../../../lib/clients/carMakers/newRenaultClient";
import ApiError, { ApiErrorEnum } from "../../../../../lib/clients/carMakers/error/apiError";

type Props = NativeStackScreenProps<LoginEntryParamList, 'OidcLoginView'> & {
    selectedCarMaker: CarMaker;
    setAccount: (account: Account) => void;
}

function generateCodeChallenge(verifier: string): string {
    const hash = CryptoJS.SHA256(verifier);

    return CryptoJS.enc.Base64.stringify(hash)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const buildAuthState = async (): Promise<OIDCAuthState> => {
    const verifier = OIDC.generateRandomString(64);
    const challenge = generateCodeChallenge(verifier);
    const state = OIDC.generateRandomString(32);
    const nonce = OIDC.generateRandomString(32);

    const params = new URLSearchParams({
        client_id: OIDC_CONFIG.CLIENT_ID,
        redirect_uri: OIDC_CONFIG.REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email personId lang renaultGroupFull',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
        nonce,
        prompt: 'login',
        accountType: 'MYRENAULT',
        ui_locales: 'fr-FR',
    })

    return {
        url: `${OIDC_CONFIG.ENDPOINT_AUTHORIZATION}?${params.toString()}`,
        verifier,
        state
    }
};

const OidcLoginView = ({ navigation, route, selectedCarMaker, setAccount }: Props) => {

    const [authState, setAuthState] = useState<OIDCAuthState | null>(null);

    const { onError } = route.params;

    useEffect(() => {
        buildAuthState().then(setAuthState)
    }, []);

    if (!authState) {
        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    function handleNavigationStateChange(navState: WebViewNavigation): void {
        if (navState.url.startsWith(OIDC_CONFIG.REDIRECT_URI)) {
            handleRedirect(navState.url);
        }
    }

    async function handleRedirect(url: string): Promise<void> {
        const queryString = url.split('?')[1];
        const params = new URLSearchParams(queryString);
        const code = params.get('code');
        const returnedState = params.get('state');
        const error = params.get('error');

        if (error) {
            onError(new Error(`OIDC error: ${error}`));
            return;
        }

        if (!code || !authState) {
            onError(new ApiError(ApiErrorEnum.MISSING_CODE_OR_STATE));
            return;
        }

        if (returnedState !== authState.state) {
            onError(new ApiError(ApiErrorEnum.INVALID_RETURNED_STATE));
            return;
        }

        try {
            const tokens = await OIDC.exchangeToken(code, authState.verifier);
            OIDC.saveTokens(tokens);

            const renaultClient = new NewRenaultClient(tokens.email);
            const kamereonAccountID = await renaultClient.getKamereonAccount(selectedCarMaker);
            if (kamereonAccountID.canLogin) {
                const renaultAccount = new RenaultAccount(tokens.email, '', kamereonAccountID.kamereonAccountID ?? '', undefined, kamereonAccountID.firstName, kamereonAccountID.lastName, selectedCarMaker);
                setAccount(renaultAccount);

                navigation.navigate("SelectACarView", {
                    account: renaultAccount
                })
            } else {
                onError(new Error(`Unable to retrieve Kamereon account ID: ${kamereonAccountID.errorMessage}`));
            }
        } catch (e) {
            onError(new Error(`Login failed: ${e instanceof Error ? e.message : String(e)}`));
        }

    };

    return <SafeAreaView style={{ flex: 1 }}>
        <WebView
            source={{ uri: authState.url }}
            originWhitelist={['*']}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={request => {
                if (request.url.startsWith(OIDC_CONFIG.REDIRECT_URI)) {
                    handleRedirect(request.url);
                    return false;
                }
                return true;
            }}
            onError={syntheticEvent => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.url?.startsWith(OIDC_CONFIG.REDIRECT_URI)) {
                    handleRedirect(nativeEvent.url);
                }
            }}
        />
    </SafeAreaView>
};

export default OidcLoginView;