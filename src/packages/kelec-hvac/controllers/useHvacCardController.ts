import { useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import CarsViewContext from "../../../lib/Contexts/CarsViewContext";
import { DEFAULT_TEMPERATURE, isMaxTemperature, isMinTemperature, stepTemperature } from "../models/Temperature";
import { TemperaturePreferences } from "../services/temperaturePreferences";
import { useHvac } from "./HvacProvider";

/** Carte climatisation : température de consigne, feuille de lancement, envoi des commandes de lancement et d'arrêt. */
export function useHvacCardController(vin: string) {
    const { languageHandler } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);
    const { status, launch, canStop, stop } = useHvac();

    const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    useEffect(() => {
        TemperaturePreferences.get(vin).then(setTemperature);
    }, [vin]);

    const changeTemperature = useCallback(async (direction: -1 | 1) => {
        const next = stepTemperature(temperature, direction);
        if (next === temperature) return;

        setTemperature(next);
        await TemperaturePreferences.set(vin, next);
    }, [temperature, vin]);

    const openSheet = useCallback(() => {
        setIsSheetOpen(true);
        handleModalAnim(true);
    }, [handleModalAnim]);

    const closeSheet = useCallback(() => {
        setIsSheetOpen(false);
        handleModalAnim(false);
    }, [handleModalAnim]);

    const launchHvac = useCallback(async () => {
        setIsLaunching(true);
        const hasLaunched = await launch(temperature);
        if (hasLaunched) {
            Alert.alert(languageHandler.getTranslation("informationSent"), languageHandler.getTranslation("preHeatLaunched"));
            closeSheet();
        } else {
            Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("commandSendError"));
        }
        setIsLaunching(false);
    }, [launch, temperature, languageHandler, closeSheet]);

    // comme pour le lancement, le statut n'est pas mis à jour de façon optimiste : la carte s'éteint au prochain fetch
    const stopHvac = useCallback(async () => {
        setIsStopping(true);
        const hasStopped = await stop();
        if (hasStopped) {
            Alert.alert(languageHandler.getTranslation("informationSent"), languageHandler.getTranslation("preHeatStopped"));
            closeSheet();
        } else {
            Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("commandSendError"));
        }
        setIsStopping(false);
    }, [stop, languageHandler, closeSheet]);

    return {
        status,
        temperature,
        canDecrease: !isMinTemperature(temperature),
        canIncrease: !isMaxTemperature(temperature),
        decreaseTemperature: () => changeTemperature(-1),
        increaseTemperature: () => changeTemperature(1),
        isSheetOpen,
        openSheet,
        closeSheet,
        isLaunching,
        launchHvac,
        showStop: canStop && status.isRunning,
        isStopping,
        stopHvac,
    };
}
