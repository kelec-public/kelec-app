import React, { useContext, useState } from "react";
import { TouchableOpacity, useColorScheme, View } from "react-native";
import Text from "../../../Common/CustomText";
import { getWhiteColour } from "../../../../lib/graphics/utils";
import BigButton from "../../../Common/BigButton";
import MainContext from "../../../../lib/Contexts/MainContext";
import { CarMakerClientErrors } from "../../../../lib/clients/carMakers/carMakerClient";
import RenaultAccount from "../../../../lib/clients/accounts/renaultAccount";
import { BatteryStatus, RenaultStatus } from "../../../../lib/clients/carMakers/renaultClient";
import Config from 'react-native-config';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../../../packages/kelec-model/view/Button';
import { RenaultCredentials } from "../../../../lib/clients/carMakers/renaultCredentials";

type DebugZoneProps = {
    readonly setShowDebugZone: (showDebugZone: boolean) => void;
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
type GigyaTokenFunctionResponse = {
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
    CHARGES = 'charges'
}

enum ApiVersion {
    V1 = 'v1',
    V2 = 'v2'
}

type BatteryStatusApiResponse = {
    data?: {
        type?: string;
        id: string;
        attributes?: BatteryStatus;
    }
}

const DebugZoneView = ({ setShowDebugZone }: DebugZoneProps): React.JSX.Element => {
    class MiniRenaultClient {
        private static readonly GIGYA_URL = 'https://gigya-prod-eu1.renaultgroup.com';
        private static readonly GIGYA_API_KEY = Config.GIGYA_API_KEY ?? '';
        private static readonly KAMEREON_URL = 'https://api-wired-prod-1-euw1.wrd-aws.com';
        private static readonly KAMEREON_API_KEY = Config.KAMEREON_API_KEY ?? '';

        email: string;
        password: string;
        kamereonAccountID: string;
        constructor(email: string, password: string, kamereonAccountID?: string) {
            this.email = email;
            this.password = password;
            this.kamereonAccountID = kamereonAccountID ?? '';
        }

        getGigyaToken = async (): Promise<GigyaTokenFunctionResponse> => {
            writeLog('Getting gigya cookie value');

            const storedCookieValue = await RenaultCredentials.getCookieValue(this.email);
            if (storedCookieValue !== null) {
                writeLog('Found stored cookie value. Returning it');
                return storedCookieValue;
            }
            writeLog('No stored cookie value found. Fetching it from the server');
            const url = MiniRenaultClient.GIGYA_URL + RenaultEndpoints.GET_GIGYA_TOKEN;
            const body = {
                loginID: this.email,
                password: this.password,
                include: 'data',
                APIKey: MiniRenaultClient.GIGYA_API_KEY ?? ''
            }
            return new Promise((resolve, reject) => {
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams(body).toString()
                }).then((response) => {
                    response.json().then((data: unknown) => {
                        writeLog('Successfully fetched gigya server')
                        const typedData = data as GigyaTokenApiResponse;
                        switch (typedData.statusCode) {
                            // good creds
                            case 200:
                                writeLog('Successfully fetched gigya token. Returning it')
                                resolve({
                                    canLogin: true,
                                    cookieValue: typedData.sessionInfo.cookieValue,
                                    personId: typedData.data.personId
                                });
                                break;
                            // bad creds
                            case 403:
                                writeLog('An known error occured :' + JSON.stringify(typedData));
                                typedData.errorDetails == "Account temporarily locked out" ?
                                    resolve({
                                        canLogin: false,
                                        errorMessage: CarMakerClientErrors.ACCOUNT_LOCKED
                                    }) :
                                    resolve({
                                        canLogin: false,
                                        errorMessage: CarMakerClientErrors.INVALID_CREDENTIALS
                                    });
                                break;
                            default:
                                writeLog('An unknown error occured :' + JSON.stringify(typedData));
                                resolve({
                                    canLogin: false,
                                    errorMessage: typedData.errorDetails
                                });
                                break;
                        }
                    }).catch((error: Error) => {
                        writeLog('Unable to communicate with server' + error.message);
                        resolve({
                            canLogin: false,
                            errorMessage: CarMakerClientErrors.SERVER_ERROR
                        });
                    });
                }).catch((error) => {
                    writeLog('Unable to open a connection with the server' + error.message);
                    resolve({
                        canLogin: false,
                        errorMessage: CarMakerClientErrors.SERVER_ERROR
                    });
                });

            });
        };

        getJWTToken = async (cookieValue: string): Promise<JWTTokenFunctionResponse> => {
            const url = `${MiniRenaultClient.GIGYA_URL}${RenaultEndpoints.GET_JWT_TOKEN}`;
            const body = {
                fields: 'data.personId,data.gigyaDataCenter',
                expiration: String(1800),
                APIKey: MiniRenaultClient.GIGYA_API_KEY ?? '',
                login_token: cookieValue
            }
            writeLog('Now getting JWT token');
            return new Promise((resolve, reject) => {
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams(body).toString()
                }).then((response) => {
                    response.json().then((data: unknown) => {
                        writeLog('Successfully fecthed Gigya server');
                        const typedData = data as JWTTokenApiResponse
                        if (typedData.statusCode === 200) {
                            writeLog('Successfully fetched JWT token. Returning it');
                        } else {
                            writeLog('Unable to decode JWT token :' + JSON.stringify(typedData));
                        }
                        typedData.statusCode === 200 ?
                            resolve({
                                canLogin: true,
                                jwtToken: typedData.id_token
                            }) :
                            resolve({
                                canLogin: false,
                                errorMessage: CarMakerClientErrors.SERVER_ERROR
                            });
                    }).catch((error: Error) => {
                        writeLog('Unable to communicate with server' + error.message);
                        resolve({
                            canLogin: false,
                            errorMessage: CarMakerClientErrors.SERVER_ERROR
                        });
                    });
                }).catch((error: Error) => {
                    writeLog('Unable to open a connection with the server' + error.message);
                    resolve({
                        canLogin: false,
                        errorMessage: CarMakerClientErrors.SERVER_ERROR
                    });
                });
            });
        };

        getKamereonEndpoint = async (endpoint: KamereonEndpoints, apiVersion: ApiVersion, vin: string, JWTToken: string, urlArgs: { key: string, value: string }[] = []): Promise<RenaultStatus> => {
            let url = `${MiniRenaultClient.KAMEREON_URL}${RenaultEndpoints.GET_KAMEREON_ACCOUNT}/${this.kamereonAccountID}/kamereon/kca/car-adapter/${apiVersion}/cars/${vin}/${endpoint}?country=FR`;
            writeLog(`Getting ${endpoint} for ${vin}`);
            urlArgs.forEach((arg) => {
                url += `&${arg.key}=${arg.value}`;
            });
            try {
                const request = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-gigya-id_token': JWTToken,
                        'apikey': MiniRenaultClient.KAMEREON_API_KEY ?? ""
                    }
                });
                writeLog(`Successfully fetched ${endpoint} for ${vin}`);
                const data: BatteryStatusApiResponse = await request.json();
                writeLog(`Raw battery status : ${JSON.stringify(data)}`);
                writeLog(`Successfully parsed ${endpoint} for ${vin}`);
                const dataFormatted = data.data?.attributes as unknown as BatteryStatus;
                writeLog(`Successfully formatted ${endpoint} for ${vin}`);
                writeLog(`Battery status : ${JSON.stringify(dataFormatted)}`);
                if (dataFormatted.timestamp) {
                    writeLog(`Battery status decoded successfully`);
                    writeLog(`Battery status : ${JSON.stringify(dataFormatted)}`);
                    return ({
                        hasError: false,
                        apiData: dataFormatted
                    });
                } else {
                    writeLog(`Unable to decode battery status`);
                    writeLog(`Battery status : ${JSON.stringify(dataFormatted)}`);
                    return ({
                        hasError: true,

                    });
                }
            } catch (e: any) {
                writeLog(`An unknown error occured while fetching ${endpoint} for ${vin}`);
                writeLog(`Error : ${JSON.stringify(e)}`);
                return {
                    hasError: true,
                }
            }
        }

    }



    const isDarkMode = useColorScheme() === 'dark';

    const { currentUser } = useContext(MainContext);

    const [logs, setLogs] = useState<string[]>([]);

    const writeLog = (log: string) => {
        setLogs(prevLogs => [...prevLogs, log]);
    };

    const listCars = (): React.ReactNode => {
        let return_node = []
        return_node.push(
            <Text
                key={'carsAvailable'}
                style={{
                    fontSize: 20
                }}>Cars available</Text>
        )
        for (const car of currentUser.getCars()) {
            return_node.push(
                <TouchableOpacity
                    key={car.getCar()?.getVin()}
                    onPress={() => {
                        const new_account = car as unknown as RenaultAccount;
                        launchDebugForCar(car.getEmail(), car.getPassword(), new_account.getKamereonAccountID(), car.getCar()?.getVin() ?? '');
                    }}>
                    <Text style={{
                        color: 'blue',
                        fontSize: 20
                    }}>{car.getCar()?.getModel()}</Text>
                </TouchableOpacity>
            )
        }
        return <View style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            {return_node}
        </View>;
    }

    const launchDebugForCar = async (email: string, password: string, accountID: string, vin: string) => {
        const client = new MiniRenaultClient(email, password, accountID);
        const gigyaToken = await client.getGigyaToken();
        if (!gigyaToken.canLogin) {
            return;
        }
        const jwtToken = await client.getJWTToken(gigyaToken.cookieValue!);
        if (!jwtToken.canLogin) {
            return;
        }
        await client.getKamereonEndpoint(KamereonEndpoints.BATTERY_STATUS, ApiVersion.V2, vin, jwtToken.jwtToken!);

    }

    const displayLogs = (): React.ReactNode => {
        if (logs.length === 0) {
            return <Text>No logs available</Text>
        }
        let return_node = []
        for (const log of logs) {
            return_node.push(
                <Text key={log}>{log}</Text>
            )
        }
        return (
            <View>
                {return_node}
            </View>
        )
    }

    return (
        <View style={{
            backgroundColor: getWhiteColour(isDarkMode),
            flex: 1
        }}
        >
            <SafeAreaView style={{
                flex: 1,

            }}>
                <View style={{
                    flex: 1,
                    paddingHorizontal: 20
                }}>
                    <View style={{
                        flex: 1,
                    }}>
                        {listCars()}
                        <Text>Logs :</Text>
                        {displayLogs()}
                    </View>
                    <Button
                        text="Close"
                        onPress={() => {
                            setShowDebugZone(false);
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default DebugZoneView;