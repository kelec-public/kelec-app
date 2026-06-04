import { NativeModules, Platform } from "react-native";
import * as Watch from 'react-native-watch-connectivity';
import UserAccount from "../clients/accounts/userAccount";
import AppPreferences from "../appPreferences/model/appPreferences";
import { GigyaTokenFunctionResponse } from "../clients/carMakers/renaultClient";
const { RNSharedWidget } = NativeModules;
const SharedStorage = NativeModules.SharedStorage;

const saveNativeAccount = async (account: UserAccount | null): Promise<void> => {
    //set password crypted
    account?.getCars().forEach(async car => {
        const password = car.getPassword();
        if (password) {
            await setNativeCryptedData(car.getCar()?.getVin() + '_password', password);
            // remove password from clear storage
            car.password = '';
        }
    });

    if (Platform.OS === 'ios') {
        const setMethod = RNSharedWidget?.setData;
        if (setMethod != undefined)
            RNSharedWidget.setData('account', JSON.stringify(account), (status: any) => {
            });
    }
    if (Platform.OS === 'android') {
        const setMethod = SharedStorage?.set;
        if (setMethod != undefined)
            SharedStorage.set('account', JSON.stringify(account));
    }
};

const setNativeCryptedData = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        const cryptedMethod = RNSharedWidget?.setCryptedData;
        if (cryptedMethod != undefined) {
            await RNSharedWidget.setCryptedData(key, value);
        }

    }
    if (Platform.OS === 'android') {
        const cryptedMethod = SharedStorage?.setEncrypted;
        if (cryptedMethod != undefined)
            await SharedStorage.setEncrypted(key, value);
    }
}

const clearNativeCryptedData = async (key: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        const cryptedMethod = RNSharedWidget?.clearCryptedData;
        if (cryptedMethod != undefined) {
            await RNSharedWidget.clearCryptedData(key);
        }
    };

    if (Platform.OS === 'android') {
        const cryptedMethod = SharedStorage?.clearEncrypted;
        if (cryptedMethod != undefined)
            await SharedStorage.clearEncrypted(key);
    }
}

const getNativeCryptedData = async (key: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        if (Platform.OS === 'ios') {
            const cryptedMethod = RNSharedWidget?.getCryptedData;
            if (cryptedMethod == undefined) {
                resolve(""); // for tests
            } RNSharedWidget.getCryptedData(key)
                .then((password: string) => {
                    resolve(password);
                })
                .catch((error: any) => {
                    resolve(null);
                })
        }

        if (Platform.OS === 'android') {
            const cryptedMethod = SharedStorage?.getEncrypted;
            if (cryptedMethod == undefined) {
                resolve(""); // for tests
            }
            SharedStorage.getEncrypted(key, (password: string | null) => {
                resolve(password);
            });
        }
    });
}

const saveNativePreferences = async (appPreferences: AppPreferences): Promise<void> => {
    if (Platform.OS === 'ios') {
        RNSharedWidget.setData('appPreferences', JSON.stringify(appPreferences), (status: any) => {
        });
    }
    if (Platform.OS === 'android') {
        SharedStorage.set('appPreferences', JSON.stringify(appPreferences));
    }
};

const saveNativeImage = async (image: string, car_vin: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        RNSharedWidget.setData(car_vin + '/image', image, (status: any) => {
        });
    }
    if (Platform.OS === 'android') {
        //useless for now
        SharedStorage.set(car_vin + '/image', image);
    }
}

const sendDataToAppleWatch = async (account: UserAccount, appPreferences: AppPreferences, cookieValue: Record<string, GigyaTokenFunctionResponse>): Promise<void> => {
    if (Platform.OS === 'ios') {
        const payload = {
            "message": JSON.stringify(account),
            "appPreferences": JSON.stringify(appPreferences),
            "cookieValue": JSON.stringify(cookieValue)
        }
        try {
            Watch.sendMessage(payload, error => {
                console.log("Error sending message to watch: ", error);
            });
        } catch {
            console.log("Error sending data to apple watch");
        }
    }
}

const refreshWidget = async (): Promise<void> => {
    if (Platform.OS === 'ios') {
        RNSharedWidget.refreshWidgets((status: any) => {
        });
    }
};

const getWidgetsLogs = async (): Promise<string | null> => {
    if (Platform.OS === 'ios') {
        return new Promise((resolve, reject) => {
            RNSharedWidget.getData("widgetLogs", (value: string | null) => {
                if (value) {
                    resolve(value);
                } else {
                    resolve(null);
                }
            });
        });
    }
    return null;
}

export interface MileageLog {
    timestamp: string;
    mileage: number;
}

const getMileageHistory = async (vin: string): Promise<MileageLog[] | null> => {
    if (Platform.OS === 'ios') {
        try {
            const response = await RNSharedWidget.async_getData(`${vin}_mileageHistory`);
            const parsed_response = JSON.parse(response);
            return parsed_response;
        } catch {
            console.log("unable to get mileage history")
            return null;
        }
    }

    if (Platform.OS === 'android') {
        try {
            const response = await SharedStorage.async_get(`${vin}_mileageHistory`);
            if (response !== null) {
                return JSON.parse(response);
            }
        } catch (err) {
            console.error("Failed to get mileage history", err);
        }
        return null;
    }

    return null;
}

const getKeyboardAvoidingView = (): 'padding' | 'height' => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
}

const getNativeBatteryStatus = async (vin: string): Promise<string | null> => {
    try {
        if (Platform.OS === 'ios') {
            const response = await RNSharedWidget.async_getData(vin + "_batteryStatus");
            return response;
        }

        if (Platform.OS === 'android') {
            const response = await SharedStorage.async_get(vin + "_batteryStatus");
            return response;
        }
    } catch {
        return null;
    }

    return null;
};



export {
    saveNativeAccount,
    saveNativeImage,
    sendDataToAppleWatch,
    refreshWidget,
    getWidgetsLogs,
    saveNativePreferences,
    getNativeCryptedData,
    setNativeCryptedData,
    getMileageHistory,
    getKeyboardAvoidingView,
    getNativeBatteryStatus,
    clearNativeCryptedData
};