import { NativeModules, Platform } from "react-native";
import * as Watch from 'react-native-watch-connectivity';
import { UserAccountInterface } from "../clients/accounts/userAccount";
import AppPreferences from "../appPreferences/model/appPreferences";
import { GigyaTokenFunctionResponse } from "../clients/carMakers/renaultClient";
/** Module natif iOS (ios/Kelec/RNSharedWidget.swift) : toutes ses méthodes renvoient une promesse. Absent dans les tests. */
const { RNSharedWidget } = NativeModules;
const SharedStorage = NativeModules.SharedStorage;

/** Écrit une chaîne dans l'App Group iOS (lue par les widgets) : les widgets sont rechargés une fois après une série d'écritures. */
const setIosSharedData = async (key: string, value: string): Promise<void> => {
    try {
        await RNSharedWidget?.setData(key, value);
    } catch (error) {
        console.log("Unable to save shared data", key, error);
    }
};

/** null si la clé n'existe pas dans l'App Group iOS. */
const getIosSharedData = async (key: string): Promise<string | null> => {
    try {
        return (await RNSharedWidget?.getData(key)) ?? null;
    } catch {
        return null;
    }
};

/**
 * Compte partagé avec les widgets (stockage NON chiffré) : doit être passé sans mot de passe,
 * voir AccountRepository.save (kelec-garage). null à la déconnexion.
 */
const saveNativeAccount = async (account: UserAccountInterface | null): Promise<void> => {
    if (Platform.OS === 'ios') {
        await setIosSharedData('account', JSON.stringify(account));
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
    if (Platform.OS === 'ios') {
        if (RNSharedWidget?.getCryptedData == undefined) {
            return ""; // for tests
        }
        try {
            return await RNSharedWidget.getCryptedData(key);
        } catch {
            return null;
        }
    }

    return new Promise((resolve) => {
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
        await setIosSharedData('appPreferences', JSON.stringify(appPreferences));
    }
    if (Platform.OS === 'android') {
        SharedStorage.set('appPreferences', JSON.stringify(appPreferences));
    }
};

const saveNativeImage = async (image: string, car_vin: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        await setIosSharedData(car_vin + '/image', image);
    }
    if (Platform.OS === 'android') {
        //useless for now
        SharedStorage.set(car_vin + '/image', image);
    }
}

/**
 * Envoi par contexte applicatif : iOS garde la dernière valeur et la livre à la montre
 * dès que possible, même si l'app de la montre est fermée.
 * Le compte doit être passé sans mot de passe : ceux dont la montre a besoin vont dans `passwords` (par VIN).
 */
const sendDataToAppleWatch = async (account: UserAccountInterface, appPreferences: AppPreferences, cookieValue: Record<string, GigyaTokenFunctionResponse>, passwords: Record<string, string>): Promise<void> => {
    if (Platform.OS === 'ios') {
        const payload = {
            "message": JSON.stringify(account),
            "appPreferences": JSON.stringify(appPreferences),
            "cookieValue": JSON.stringify(cookieValue),
            "passwords": JSON.stringify(passwords)
        }
        try {
            Watch.updateApplicationContext(payload);
        } catch (error) {
            console.log("Error sending data to apple watch", error);
        }
    }
}

const refreshWidget = async (): Promise<void> => {
    if (Platform.OS === 'ios') {
        await RNSharedWidget?.refreshWidgets();
    }
};

const getWidgetsLogs = async (): Promise<string | null> => {
    if (Platform.OS === 'ios') {
        return (await getIosSharedData("widgetLogs")) || null;
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
            const response = await getIosSharedData(`${vin}_mileageHistory`);
            return response !== null ? JSON.parse(response) : null;
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
            return await getIosSharedData(vin + "_batteryStatus");
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