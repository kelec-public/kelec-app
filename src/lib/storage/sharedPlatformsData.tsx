import { NativeModules, Platform } from "react-native";
import * as Watch from 'react-native-watch-connectivity';
import { UserAccountInterface } from "../clients/accounts/userAccount";
import AppPreferences from "../appPreferences/model/appPreferences";
import { GigyaTokenFunctionResponse } from "../clients/carMakers/renaultClient";
/**
 * Module natif du stockage partagé avec les widgets, même API sur les deux plateformes
 * (ios/Kelec/RNSharedWidget.swift, android/.../bridge/RNSharedWidget.kt) : toutes ses méthodes renvoient une promesse.
 * Absent dans les tests.
 */
const { RNSharedWidget } = NativeModules;

/** Écrit une chaîne dans le stockage partagé (lu par les widgets) : les widgets sont rechargés une fois après une série d'écritures. */
const setSharedData = async (key: string, value: string): Promise<void> => {
    try {
        await RNSharedWidget?.setData(key, value);
    } catch (error) {
        console.log("Unable to save shared data", key, error);
    }
};

/** null si la clé n'existe pas dans le stockage partagé. */
const getSharedData = async (key: string): Promise<string | null> => {
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
    await setSharedData('account', JSON.stringify(account));
};

const setNativeCryptedData = async (key: string, value: string): Promise<void> => {
    await RNSharedWidget?.setCryptedData(key, value);
}

const clearNativeCryptedData = async (key: string): Promise<void> => {
    await RNSharedWidget?.clearCryptedData(key);
}

/** null si la clé est absente ou illisible. */
const getNativeCryptedData = async (key: string): Promise<string | null> => {
    if (RNSharedWidget?.getCryptedData == undefined) {
        return ""; // for tests
    }
    try {
        return await RNSharedWidget.getCryptedData(key);
    } catch {
        return null;
    }
}

const saveNativePreferences = async (appPreferences: AppPreferences): Promise<void> => {
    await setSharedData('appPreferences', JSON.stringify(appPreferences));
};

/** Image de la voiture, affichée par les widgets iOS seulement. */
const saveNativeImage = async (image: string, car_vin: string): Promise<void> => {
    if (Platform.OS === 'ios') {
        await setSharedData(car_vin + '/image', image);
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
    await RNSharedWidget?.refreshWidgets();
};

const getWidgetsLogs = async (): Promise<string | null> => {
    return (await getSharedData("widgetLogs")) || null;
}

export interface MileageLog {
    timestamp: string;
    mileage: number;
}

const getMileageHistory = async (vin: string): Promise<MileageLog[] | null> => {
    try {
        const response = await getSharedData(`${vin}_mileageHistory`);
        return response !== null ? JSON.parse(response) : null;
    } catch {
        console.log("unable to get mileage history")
        return null;
    }
}

const getKeyboardAvoidingView = (): 'padding' | 'height' => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
}

const getNativeBatteryStatus = async (vin: string): Promise<string | null> => {
    return getSharedData(vin + "_batteryStatus");
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