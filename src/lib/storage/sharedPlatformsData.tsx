import { NativeModules, Platform } from "react-native";
import * as Watch from 'react-native-watch-connectivity';
import UserAccount from "../clients/accounts/userAccount";
import AppPreferences from "../appPreferences/model/appPreferences";
const { RNSharedWidget } = NativeModules;
const SharedStorage = NativeModules.SharedStorage;

const saveNativeAccount = async (account: UserAccount | null): Promise<void> => {

    if (Platform.OS === 'ios') {
        //set password crypted
        account?.getCars().forEach(async car => {
            const password = car.getPassword();
            if (password) {
                await setNativeCryptedData(car.getCar()?.getVin() + '_password', password);
                // remove password from clear storage
                car.password = '';
            }
        });

        const cryptedMethod = RNSharedWidget?.setData;
        if (cryptedMethod != undefined)
            RNSharedWidget.setData('account', JSON.stringify(account), (status: any) => {
            });
    }
    if (Platform.OS === 'android') {
        //set password crypted
        account?.getCars().forEach(async car => {

            const password = car.getPassword();
            if (password) {
                await setNativeCryptedData(car.getCar()?.getVin() + '_password', password);
                // remove password from clear storage
                car.password = '';
            }
        });

        const cryptedMethod = SharedStorage?.set;
        if (cryptedMethod != undefined)
            SharedStorage.set('account', JSON.stringify(account));
    }
};

const getNativeCryptedData = async (key: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        if (Platform.OS === 'ios') {
            const cryptedMethod = RNSharedWidget?.getCryptedData;
            if (cryptedMethod == undefined) {
                resolve(null);
                return;
            }
            RNSharedWidget.getCryptedData(key)
                .then((data: string) => {
                    resolve(data);
                })
                .catch((error: any) => {
                    reject(error);
                })
        }

        if (Platform.OS === 'android') {
            const crypedMethod = SharedStorage?.getEncrypted;
            if (crypedMethod == undefined) {
                resolve(null);
                return;
            }
            SharedStorage.getEncrypted(key, (data: string | null) => {
                resolve(data);
            });
        }
    });
};

const setNativeCryptedData = async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        const cryptedMethod = RNSharedWidget?.setCryptedData;
        if (cryptedMethod != undefined) {
            await RNSharedWidget.setCryptedData(key, value);
            console.log(`Set crypted data for key: ${key}`);
        }

    }
    if (Platform.OS === 'android') {
        const cryptedMethod = SharedStorage?.setEncrypted;
        if (cryptedMethod != undefined)
            await SharedStorage.setEncrypted(key, value);
    }
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

const sendDataToAppleWatch = async (account: UserAccount, appPreferences: AppPreferences): Promise<void> => {
    if (Platform.OS === 'ios') {
        const payload = {
            "message": JSON.stringify(account),
            "appPreferences": JSON.stringify(appPreferences)
        }
        console.log(payload);
        try {
            Watch.sendMessage(payload, error => {

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

const getValidToken = async (email: string): Promise<string | null> => {
    if (Platform.OS === 'ios') {
        return await RNSharedWidget.getValidToken(email);
    }
    if (Platform.OS === 'android') {
        return await SharedStorage.getValidToken(email);
    }

    return null;
};

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
    getMileageHistory,
    getKeyboardAvoidingView,
    getNativeBatteryStatus,
    setNativeCryptedData,
    getValidToken
};