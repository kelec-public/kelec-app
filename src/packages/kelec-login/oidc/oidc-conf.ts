import 'react-native-get-random-values';
import { CarMaker } from '../../../lib/clients/accounts/account';
import Config from 'react-native-config';

export const COMPATIBLE_OIDC_CAR_MAKERS = [
    CarMaker.ALPINE,
    CarMaker.DACIA,
    CarMaker.RENAULT
]

export const OIDC_CONFIG = {
    REDIRECT_URI: Config.OIDC_REDIRECT_URI ?? '',
    ENDPOINT_AUTHORIZATION: Config.OIDC_ENDPOINT_AUTHORIZE ?? '',
    ENDPOINT_TOKEN: Config.OIDC_ENDPOINT_TOKEN ?? '',
    ENDPOINT_USERINFO: Config.OIDC_ENDPOINT_USERINFO ?? '',
    CLIENT_ID: Config.OIDC_CLIENT_ID ?? ''
}

export interface OIDCAuthState {
    url: string;
    verifier: string;
    state: string;
}