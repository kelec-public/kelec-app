import Config from "react-native-config";
import OIDC, { OidcTokens } from "../../../packages/kelec-login/oidc/oidc";
import CarMakerClient from "./carMakerClient";
import { CarMaker } from "../accounts/account";

enum ApiEndpoints {
    V1 = "/myr/api/v1",
    CONNECTION = "/connection"
}

class NewRenaultClient extends CarMakerClient {

    private static readonly API_BASE_URL = "https://apis.renault.com"
    private static readonly API_BASE_URL_KEY = Config.KAMEREON_API_KEY ?? '';

    // tableau de matching des constructeurs pour kamereon
    private static readonly carMakerMapping: Record<CarMaker, string> = {
        [CarMaker.RENAULT]: 'MYRENAULT',
        [CarMaker.ALPINE]: 'MYALPINE',
        [CarMaker.DACIA]: 'MYDACIA',
        [CarMaker.HYUNDAI]: 'MYHYUNDAI',
        [CarMaker.DEMO]: 'MYDEMO'
    }

    // pas besoin du mot de passe car OIDC
    constructor(email: string) {
        super(email, '');
    }

    private readonly getJWTToken = async (): Promise<OidcTokens> => {
        const tokens = await OIDC.getTokens(this.getEmail());
        if (!tokens) {
            throw new Error('No tokens found for email: ' + this.getEmail());
        }
        return tokens;
    }

    async getKamereonAccount(carMaker: CarMaker): Promise<KamereonAccountIDFunctionResponse> {
        try {
            const tokens = await this.getJWTToken();
            const urlParams = new URLSearchParams({
                country: "FR",
                product: NewRenaultClient.carMakerMapping[carMaker],
                locale: "fr-FR",
                displayAccounts: NewRenaultClient.carMakerMapping[carMaker]
            })
            const response = await fetch(`${NewRenaultClient.API_BASE_URL}${ApiEndpoints.V1}${ApiEndpoints.CONNECTION}?${urlParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'apiKey': NewRenaultClient.API_BASE_URL_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get Kamereon account ID: ${response.status}`);
            }

            const responseData = await response.json() as ApiConnectionResponse;
            const accounts = responseData.currentUser.accounts;
            const account = accounts.find(acc => acc.accountStatus === 'ACTIVE' && acc.accountType === NewRenaultClient.carMakerMapping[carMaker]);
            if (!account) {
                throw new Error('No active account found for car maker: ' + carMaker);
            }
            return {
                canLogin: true,
                kamereonAccountID: account.accountId,
                firstName: responseData.currentUser.firstName,
                lastName: responseData.currentUser.lastName
            }
        } catch (e) {
            return {
                canLogin: false,
                errorMessage: e instanceof Error ? e.message : String(e)
            }
        }
    }
}


// ---- KAMAREON ACCOUNT ID ----
// list des comptes de l'user
type ApiConnectionResponse = {
    currentUser: {
        firstName?: string;
        lastName?: string;
        accounts: {
            accountId: string;
            accountStatus: string;
            accountType: string;
        }[];
    }
}

type KamereonAccountIDFunctionResponse = {
    canLogin: boolean;
    errorMessage?: string;
    firstName?: string;
    lastName?: string;
    kamereonAccountID?: string;
}

export default NewRenaultClient;