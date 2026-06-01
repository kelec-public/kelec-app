import CarMakerClient, { CarMakerClientErrors } from "./carMakerClient";
import RenaultCharge from "../apiHandlers/renaultCharges/RenaultCharge";
import { HVACStatusEnum } from "./renaultEnums";
import { V2GApiResponse, V2GApiSession } from "./renault/v2gApiResponse";
import Config from 'react-native-config';
import OIDC from "../../../packages/kelec-login/oidc/oidc";
import { jwtDecode } from "jwt-decode";

enum RenaultEndpoints {
    // 1st step, get gigya token
    GET_GIGYA_TOKEN = '/accounts.login',
    // 2nd step, get JWT token
    GET_JWT_TOKEN = '/accounts.getJWT',

    // get kamereon account id
    GET_KAMEREON_ACCOUNT_ID = '/commerce/v1/persons',

    // get kamereon account
    GET_KAMEREON_ACCOUNT = '/commerce/v1/accounts'

}

enum KamereonEndpoints {
    BATTERY_STATUS = 'battery-status',
    COCKPIT = 'cockpit',
    LOCATION = 'location',
    CHARGES = 'charges',
    CHARGES_SETTINGS = 'charging-settings',
    HVAC_STATUS = 'hvac-status'
}

enum ApiVersion {
    V1 = 'v1',
    V2 = 'v2'
}

// dict returned by the api call to get the gigya token
type GigyaTokenApiResponse = {
    errorCode: number;
    errorDetails: string;
    errorMessage: string;
    statusCode: number;
    statusReason: string;
    data: {
        personId: string;
        gigyaDataCenter: string;
    }
    sessionInfo: {
        cookieName: string;
        cookieValue: string;
    }
}

// dict returned by the function getGigyaToken
export type GigyaTokenFunctionResponse = {
    canLogin: boolean;
    errorMessage?: string;
    cookieValue?: string;
    personId?: string;
}

// dict returned by the api call to get the JWT token
type JWTTokenApiResponse = {
    errorCode: number;
    errorDetails?: string;
    errorMessage?: string;
    statusCode: number;
    statusReason: string;
    id_token?: string;
}

// dict returned by the function getJWTToken
type JWTTokenFunctionResponse = {
    canLogin: boolean;
    error?: string;
    errorMessage?: string;
    jwtToken?: string;
}

// dict returned by the api call to get the kamereon account id
type KamereonAccountIDApiResponse = {
    personId: string;
    firstName: string;
    lastName: string;
    accounts: {
        accountId: string;
        accountStatus: string;
        accountType: string;
    }[]
}

// dict returned by the function getKamereonAccountID
type KamereonAccountIDFunctionResponse = {
    canLogin: boolean;
    errorMessage?: string;
    firstName?: string;
    lastName?: string;
    kamereonAccountID?: string;
}



// dict returned by the function login
type LoginFunctionReponse = {
    canLogin: boolean;
    errorMessage?: string;
    kamereonAccountID?: string;
    firstName?: string;
    lastName?: string;
}

type BatteryStatusApiResponse = {
    data?: {
        type?: string;
        id: string;
        attributes?: BatteryStatus | CockpitStatus | ChargesHistory;
    }
}

type RenaultStatus = {
    hasError: boolean;
    errorMessage?: string;
    apiData?: any;
}

type BatteryStatus = {
    timestamp?: string;
    batteryLevel?: number;
    batteryTemperature?: number;
    batteryAutonomy?: number;
    batteryCapacity?: number;
    batteryAvailableEnergy?: number;
    plugStatus?: number;
    chargingStatus?: number;
    chargingRemainingTime?: number;
    chargingInstantaneousPower?: number;
}

type ChargesHistory = {
    charges: RenaultCharge[]
}

type ChargeSettingsStatus = {
    dateTime: string;
    mode: ChargeMode;
    startDateTime: string; // only for delayed
    delay: number; // only for delayed
    schedules: ChargeSchedule[];
}

type HVACStatus = {
    internalTemperature?: number;
    hvacStatus?: HVACStatusEnum;
    socThreshold?: number;
    lastUpdateTime?: string;
}



enum ChargeMode {
    ALWAYS = 'always',
    SCHEDULED = 'scheduled',
    DELAYED = 'delayed',
}


type ChargeSchedule = {
    id: number;
    activated: boolean;
    monday: ChargeScheduleDay | null;
    tuesday: ChargeScheduleDay | null;
    wednesday: ChargeScheduleDay | null;
    thursday: ChargeScheduleDay | null;
    friday: ChargeScheduleDay | null;
    saturday: ChargeScheduleDay | null;
    sunday: ChargeScheduleDay | null;
}

type ChargeScheduleDay = {
    startTime: string;
    duration: number;
}

type CockpitStatus = {
    totalMileage?: number;
    fuelAutonomy?: number;
    fuelQuantity?: number;
}

type MapLocationStatus = {
    lastUpdateTime?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
}

class RenaultClient extends CarMakerClient {

    private static readonly GIGYA_URL = 'https://gigya-prod-eu1.renaultgroup.com';
    private static readonly GIGYA_API_KEY = Config.GIGYA_API_KEY;
    private static readonly KAMEREON_URL = 'https://api-wired-prod-1-euw1.wrd-aws.com';
    private static readonly KAMEREON_API_KEY = Config.KAMEREON_API_KEY;

    kamereonAccountID: string;

    constructor(email: string, password: string, kamereonAccountID?: string) {
        super(email, password);
        this.kamereonAccountID = kamereonAccountID ?? '';
    }


    private readonly getJWTToken = async (cookieValue?: string): Promise<JWTTokenFunctionResponse> => {
        // on récupère depuis l'oidc
        let tokens = await OIDC.getTokens(this.getEmail());
        if (tokens) {
            // on vérifie que le token est toujours valide
            const access_token = tokens.access_token;
            try {
                const decoded = jwtDecode(access_token);
                const now = Date.now() / 1000; // unix timestamp in seconds
                // on vérifie que le token est encore valide au moins 30 secondes
                if (decoded.exp && decoded.exp < now + 30) {
                    // on refresh le token
                    const refreshedTokens = await OIDC.refreshTokens(tokens);
                    await OIDC.saveTokens(refreshedTokens);
                    tokens = refreshedTokens;
                }
                return {
                    canLogin: true,
                    jwtToken: tokens.access_token
                }
            } catch (error) {
                // token invalide 
                return {
                    canLogin: false,
                    errorMessage: 'Invalid token'
                }
            }
        } else {
            return {
                canLogin: false
            }
        }
    };

    private readonly handleBatteryStatus = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as BatteryStatus;
        if (dataFormatted.timestamp) {
            return ({
                hasError: false,
                apiData: dataFormatted
            });
        } else {
            return ({
                hasError: true,

            });
        }
    }

    private readonly handleCockpitStatus = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as CockpitStatus;
        if (dataFormatted.totalMileage) {
            return ({
                hasError: false,
                apiData: dataFormatted
            });
        } else {
            return ({
                hasError: true,

            });
        }
    }

    private readonly handleLocationStatus = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as MapLocationStatus;
        if (dataFormatted.lastUpdateTime) {
            return ({
                hasError: false,
                apiData: dataFormatted
            });
        } else {
            return ({
                hasError: true,

            });
        }
    }

    private readonly handleChargesHistory = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as ChargesHistory;
        if (dataFormatted.charges) {
            const usableCharges = [];
            for (let charge of dataFormatted.charges) {
                if (charge.chargeEndDate !== undefined && (charge.chargeDuration ?? 0) > 0 && (charge.chargeEnergyRecovered ?? 1) > 0) {
                    usableCharges.push(charge);
                }
            }
            return ({
                hasError: false,
                apiData: usableCharges
            });
        } else {
            return ({
                hasError: true,

            });

        }
    }

    private readonly handleChargeSettings = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as ChargeSettingsStatus;
        if (dataFormatted.dateTime) {
            return ({
                hasError: false,
                apiData: dataFormatted
            });
        }
        return ({
            hasError: true,
        });

    }

    private readonly handleHVACStatus = (data: BatteryStatusApiResponse): RenaultStatus => {
        const dataFormatted = data.data?.attributes as unknown as HVACStatus;
        if (dataFormatted.lastUpdateTime && dataFormatted.hvacStatus) {
            return ({
                hasError: false,
                apiData: dataFormatted
            });
        }
        return ({
            hasError: true,
        });
    }

    static readonly handleError = (data: any): string => {
        // returns empty string if there is no error, else returns the error message
        try {
            if (data.errors.length > 0) {
                return data.errors[0].errorCode;
            }
            return "";
        } catch {
            return "";
        }

    }

    private readonly getKamereonEndpoint = async (endpoint: KamereonEndpoints, apiVersion: ApiVersion, vin: string, JWTToken: string, urlArgs: { key: string, value: string }[] = []): Promise<RenaultStatus> => {
        let url = `${RenaultClient.KAMEREON_URL}${RenaultEndpoints.GET_KAMEREON_ACCOUNT}/${this.kamereonAccountID}/kamereon/kca/car-adapter/${apiVersion}/cars/${vin}/${endpoint}?country=FR`;
        urlArgs.forEach((arg) => {
            url += `&${arg.key}=${arg.value}`;
        });
        try {
            const request = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-gigya-id_token': JWTToken,
                    'apikey': RenaultClient.KAMEREON_API_KEY,
                    'Authorization': `Bearer ${JWTToken}`
                }
            });
            const data: BatteryStatusApiResponse = await request.json();
            const error = RenaultClient.handleError(data);
            if (error !== "") {
                return {
                    hasError: true,
                    errorMessage: error
                }
            }
            switch (endpoint) {
                case KamereonEndpoints.BATTERY_STATUS: {
                    return this.handleBatteryStatus(data);
                }
                case KamereonEndpoints.COCKPIT: {
                    return this.handleCockpitStatus(data);
                }
                case KamereonEndpoints.LOCATION: {
                    return this.handleLocationStatus(data);
                }
                case KamereonEndpoints.CHARGES: {
                    return this.handleChargesHistory(data);
                }
                case KamereonEndpoints.CHARGES_SETTINGS: {
                    return this.handleChargeSettings(data);
                }
                case KamereonEndpoints.HVAC_STATUS: {
                    return this.handleHVACStatus(data);
                }
            }
        } catch (error: any) {
            const errorMessage = error.message;
            if (errorMessage?.includes("err.func")) {
                throw error;
            }
            return {
                hasError: true,
            }
        }
    }

    private readonly launchHVACApi = async (jwtToken: string, vin: string, temperature: number): Promise<boolean> => {
        const url = `${RenaultClient.KAMEREON_URL}/commerce/v1/accounts/${this.kamereonAccountID}/kamereon/kca/car-adapter/v1/cars/${vin}/actions/hvac-start?country=FR`;
        const body = {
            data: {
                type: 'HvacStart',
                id: "-------",
                attributes: {
                    action: 'start',
                    id: "-------",
                    targetTemperature: temperature
                }
            }
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/vnd.api+json',
                    'apikey': RenaultClient.KAMEREON_API_KEY,
                    'x-gigya-id_token': jwtToken,
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify(body)
            })
            const data = await response.json();
            try {
                return data.data.type === "HvacStart" && data.data.id !== undefined;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    };


    getBatteryStatus = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
                errorMessage: CarMakerClientErrors.SERVER_ERROR
            };
        }
        const batteryStatus = await this.getKamereonEndpoint(KamereonEndpoints.BATTERY_STATUS, ApiVersion.V2, vin, jwtToken.jwtToken!);
        return batteryStatus;


    }

    getCockpit = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
            };
        }
        const batteryStatus = await this.getKamereonEndpoint(KamereonEndpoints.COCKPIT, ApiVersion.V1, vin, jwtToken.jwtToken!);
        return batteryStatus;
    }

    getLocation = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
            };
        }
        const locationStatus = await this.getKamereonEndpoint(KamereonEndpoints.LOCATION, ApiVersion.V1, vin, jwtToken.jwtToken!);
        return locationStatus
    }

    getHVACStatus = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
            };
        }
        const hvacStatus = await this.getKamereonEndpoint(KamereonEndpoints.HVAC_STATUS, ApiVersion.V1, vin, jwtToken.jwtToken!);
        return hvacStatus
    }

    launchHVAC = async (vin: string, temperature: number): Promise<boolean> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return false;
        }
        const hasLaunched = await this.launchHVACApi(jwtToken.jwtToken!, vin, temperature);
        return hasLaunched;
    }

    getChargesHistory = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
            };
        }
        const urlArgs = [
            {
                key: 'start',
                value: '2000-01-01'
            },
            {
                key: 'end',
                value: '2040-12-31'
            }
        ];
        const chargesHistory = await this.getKamereonEndpoint(KamereonEndpoints.CHARGES, ApiVersion.V1, vin, jwtToken.jwtToken!, urlArgs);
        return chargesHistory;
    }

    getV2GChargesHistory = async (vin: string): Promise<V2GApiSession[]> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) throw new Error(CarMakerClientErrors.SERVER_ERROR);
        const urlArgs = [
            {
                key: 'start',
                value: '2000-01-01'
            },
            {
                key: 'end',
                value: '2040-12-31'
            },
            {
                key: 'country',
                value: 'FR'
            }
        ];
        let url = `https://api-wired-prod-1-euw1.wrd-aws.com/wired/lkcd/v1/accounts/${this.kamereonAccountID}/lkcd/vss/v1/cars/${vin}/sessions?country=FR`;
        urlArgs.forEach((arg) => {
            url += `&${arg.key}=${arg.value}`;
        });
        try {
            const request = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-gigya-id_token': jwtToken.jwtToken!,
                    'apikey': RenaultClient.KAMEREON_API_KEY
                }
            });
            const data: V2GApiResponse = await request.json();
            const error = RenaultClient.handleError(data);
            if (error !== "") {
                throw new Error(error);
            }

            if ((data._embedded?.sessions?.length ?? 0) > 0) {
                return data._embedded?.sessions ?? [];
            } else {
                throw new Error(CarMakerClientErrors.SERVER_ERROR);
            }
        } catch {
            throw new Error(CarMakerClientErrors.SERVER_ERROR);
        }
    }

    getChargeSettings = async (vin: string): Promise<RenaultStatus> => {
        const jwtToken = await this.getJWTToken();
        if (!jwtToken.canLogin) {
            return {
                hasError: true,
            };
        }
        const chargeSettings = await this.getKamereonEndpoint(KamereonEndpoints.CHARGES_SETTINGS, ApiVersion.V1, vin, jwtToken.jwtToken!);
        return chargeSettings;
    }
}
export type { RenaultStatus, BatteryStatus, CockpitStatus, MapLocationStatus, ChargesHistory, ChargeSettingsStatus, ChargeSchedule, HVACStatus };
export default RenaultClient;
