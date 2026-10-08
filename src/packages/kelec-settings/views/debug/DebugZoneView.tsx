import React, { useContext, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "@react-navigation/native";
import Text from "../../../../screen/Common/CustomText";
import { getBlackColour, getWhiteColour } from "../../../../lib/graphics/utils";
import commonStyles, { fontFamilyBold } from "../../../../lib/graphics/commonStyle";
import MainContext from "../../../../lib/Contexts/MainContext";
import { CarMakerClientErrors } from "../../../../lib/clients/carMakers/carMakerClient";
import RenaultAccount from "../../../../lib/clients/accounts/renaultAccount";
import Account, { CarMaker } from "../../../../lib/clients/accounts/account";
import { BatteryStatus, RenaultStatus } from "../../../../lib/clients/carMakers/renaultClient";
import Config from 'react-native-config';
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../../kelec-model/view/Button';
import { RenaultCredentials } from "../../../../lib/clients/carMakers/renaultCredentials";
import { formatMileageEntry, lastMileageEntries } from "../../services/mileageHistoryDebug";
import SettingRow from "../SettingRow";
import { shareTextFile } from "../../services/fileShare";
import { OptionType } from "../../controllers/settingsTypes";

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
    const theme = useTheme();

    const { currentUser } = useContext(MainContext);

    const [selectedCar, setSelectedCar] = useState<Account | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const writeLog = (log: string) => {
        setLogs(prevLogs => [...prevLogs, log]);
    };

    const selectCar = (car: Account | null) => {
        setLogs([]);
        setSelectedCar(car);
    };

    const launchBatteryStatus = async (car: Account) => {
        setLogs([]);
        const vin = car.getCar()?.getVin() ?? '';
        const client = new MiniRenaultClient(car.getEmail(), car.getPassword(), (car as RenaultAccount).getKamereonAccountID());
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

    /** Les 10 dernières entrées de l'historique de kilométrage (écrit par le widget). */
    const showMileageHistory = async (car: Account) => {
        setLogs([]);
        const entries = await lastMileageEntries(car.getCar()?.getVin() ?? '');
        writeLog(`${entries.length} last entries (oldest first)`);
        if (entries.length === 0) {
            writeLog('No mileage history');
        }
        entries.forEach(entry => writeLog(formatMileageEntry(entry)));
    }

    const exportLogs = () => {
        if (logs.length === 0) {
            Alert.alert('No logs to export');
            return;
        }
        shareTextFile(`debugLogs${Date.now()}.txt`, logs.join('\n'), 'text/plain');
    }

    const carList = (): React.ReactNode => (
        <>
            <Text style={styles.subtitle}>Choose a car</Text>
            {currentUser.getCars().map(car => (
                <SettingRow
                    key={car.getCar()?.getVin()}
                    icon="directions-car"
                    title={car.getCar()?.getModel() ?? ''}
                    description={car.getCar()?.getVin()}
                    type={OptionType.NAVIGATE}
                    onPress={() => selectCar(car)}
                />
            ))}
        </>
    );

    const carActions = (car: Account): React.ReactNode => (
        <>
            <TouchableOpacity style={[commonStyles.rowFlex, commonStyles.gap5, styles.back]} onPress={() => selectCar(null)}>
                <Icon name="arrow-back" size={20} color={getBlackColour(isDarkMode)} />
                <Text style={styles.subtitle}>{car.getCar()?.getModel()}</Text>
            </TouchableOpacity>
            {RENAULT_GROUP.includes(car.getCarMaker()) ? (
                <SettingRow
                    icon="battery-charging-full"
                    title="Battery status"
                    description="Gigya → JWT → Kamereon battery-status"
                    type={OptionType.NAVIGATE}
                    onPress={() => launchBatteryStatus(car)}
                />
            ) : null}
            <SettingRow
                icon="speed"
                title="Mileage history"
                description="10 last entries written by the widget"
                type={OptionType.NAVIGATE}
                onPress={() => showMileageHistory(car)}
            />
            <Text style={styles.subtitle}>Logs</Text>
            <View style={[styles.logs, { borderColor: getBlackColour(isDarkMode) }]}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.logsContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                >
                    {logs.length === 0
                        ? <Text style={styles.logLine}>No logs available</Text>
                        : logs.map((log, index) => <Text key={index} style={styles.logLine}>{log}</Text>)}
                </ScrollView>
            </View>
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: getWhiteColour(isDarkMode) }]}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Debug zone</Text>
                    <View style={[styles.container, commonStyles.gap10]}>
                        {selectedCar ? carActions(selectedCar) : carList()}
                    </View>
                    {selectedCar ? (
                        <Button
                            text="Export"
                            icon="ios-share"
                            buttonStyle={theme.buttons.neutral}
                            onPress={exportLogs}
                        />
                    ) : null}
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

const RENAULT_GROUP = [CarMaker.RENAULT, CarMaker.DACIA, CarMaker.ALPINE];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 15,
    },
    title: {
        fontSize: 24,
        fontFamily: fontFamilyBold,
    },
    subtitle: {
        fontSize: 18,
        fontFamily: fontFamilyBold,
    },
    back: {
        alignItems: 'center',
    },
    logs: {
        flex: 1,
        minHeight: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        overflow: 'hidden',
    },
    logsContent: {
        padding: 10,
    },
    logLine: {
        fontSize: 12,
        marginBottom: 4,
    },
});

export default DebugZoneView;