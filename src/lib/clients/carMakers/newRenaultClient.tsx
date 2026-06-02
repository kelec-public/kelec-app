import Config from "react-native-config";
import OIDC, { OidcTokens } from "../../../packages/kelec-login/oidc/oidc";
import CarMakerClient from "./carMakerClient";
import { CarMaker } from "../accounts/account";
import { VehicleLinkApi } from "./renault/vehicleLink";
import { jwtDecode } from "jwt-decode";
import ApiError, { ApiErrorEnum } from "./error/apiError";
import { getValidToken } from "../../storage/sharedPlatformsData";
import { Platform } from "react-native";

enum ApiEndpoints {
    V1 = "/myr/api/v1",
    CONNECTION = "/connection",
    ACCOUNTS = "/accounts",
    CONNECTED_VEHICLES = "/connected-vehicles"
}

class NewRenaultClient extends CarMakerClient {

    private static readonly API_BASE_URL = "https://apis.renault.com"
    private static readonly API_BASE_URL_KEY = Config.KAMEREON_API_KEY ?? '';

    private readonly kamereonAccountID: string;

    // tableau de matching des constructeurs pour kamereon
    private static readonly carMakerMapping: Record<CarMaker, string> = {
        [CarMaker.RENAULT]: 'MYRENAULT',
        [CarMaker.ALPINE]: 'MYALPINE',
        [CarMaker.DACIA]: 'MYDACIA',
        [CarMaker.HYUNDAI]: 'MYHYUNDAI',
        [CarMaker.DEMO]: 'MYDEMO'
    }

    // pas besoin du mot de passe car OIDC
    constructor(email: string, kamereonAccountID?: string) {
        super(email, '');
        this.kamereonAccountID = kamereonAccountID ?? '';
    }

    // JWT TOKEN
    private readonly getJWTToken = async (): Promise<OidcTokens> => {
        const raw = await getValidToken(this.getEmail());
        if (!raw) throw new ApiError(ApiErrorEnum.NO_TOKENS_FOUND);
        return JSON.parse(raw) as OidcTokens;
    }


    // KAMAREON ACCOUNT ID
    public async getKamereonAccount(carMaker: CarMaker): Promise<KamereonAccountIDFunctionResponse> {
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
                throw new ApiError(ApiErrorEnum.FAILED_TO_GET_KAMEREON_ACCOUNT_ID);
            }

            const responseData = await response.json() as ApiConnectionResponse;
            const accounts = responseData.currentUser.accounts;
            const account = accounts.find(acc => acc.accountStatus === 'ACTIVE' && acc.accountType === NewRenaultClient.carMakerMapping[carMaker]);
            if (!account) {
                throw new ApiError(ApiErrorEnum.NO_ACTIVE_ACCOUNT_FOUND);
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

    // GARAGE
    public async getVehicles(): Promise<VehicleLinkApi[]> {
        const jwtToken = await this.getJWTToken();
        const urlParams = new URLSearchParams({
            country: "FR",
            locale: "fr-FR"
        });
        const response = await fetch(`${NewRenaultClient.API_BASE_URL}${ApiEndpoints.V1}${ApiEndpoints.ACCOUNTS}/${this.kamereonAccountID}${ApiEndpoints.CONNECTED_VEHICLES}?${urlParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken.access_token}`,
                'apiKey': NewRenaultClient.API_BASE_URL_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new ApiError(ApiErrorEnum.FAILED_TO_GET_VEHICLES);
        }
        const responseData = await response.json() as { vehicleLinks: VehicleLinkApi[] };
        return responseData.vehicleLinks;
    };

    // CAR STATUS
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