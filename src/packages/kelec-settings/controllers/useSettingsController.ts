import { useCallback, useContext, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { BooleanPreference, usePreferences } from "../../kelec-preferences";
import { ExternalLinks, openExternalLink } from "../services/externalLinks";
import { syncWithAppleWatch } from "../services/appleWatchSync";
import { exportWidgetLogs } from "../services/widgetLogsExport";
import { OptionType, SettingSection } from "./settingsTypes";

/** Onglet Réglages : sections affichées, actions, et modales (fuseau horaire, debug). */
export function useSettingsController() {
    const { currentUser, languageHandler, reloadUser, storageHandler, checkOnboarding } = useContext(MainContext);
    const { preferences, update } = usePreferences();
    const t = (key: string) => languageHandler.getTranslation(key);

    const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
    const [isDebugZoneOpen, setIsDebugZoneOpen] = useState(false);

    const logOut = useCallback(async () => {
        await storageHandler.logOut();
        checkOnboarding();
        reloadUser();
    }, [storageHandler, checkOnboarding, reloadUser]);

    const selectTimezoneOffset = useCallback(async (offset: number) => {
        await update({ scheduledChargeOffset: offset });
        setIsTimezoneModalOpen(false);
    }, [update]);

    const toggle = (field: BooleanPreference) =>
        () => { update({ [field]: !preferences[field] }); };

    const sections: SettingSection[] = [
        {
            title: t("general"),
            showTitle: false,
            items: [
                { title: t("sendFeedback"), icon: "feedback", type: OptionType.NAVIGATE, onPress: () => openExternalLink(ExternalLinks.FEEDBACK) },
                { title: t("helpTranslateTheApp"), icon: "language", type: OptionType.NAVIGATE, onPress: () => openExternalLink(ExternalLinks.TRANSLATE) },
                { title: t("joinDiscord"), icon: "group", type: OptionType.NAVIGATE, onPress: () => openExternalLink(ExternalLinks.DISCORD) },
                {
                    title: t("syncWithAppleWatch"), icon: "watch", type: OptionType.NAVIGATE,
                    description: t("watchOnForeground"),
                    onPress: () => { syncWithAppleWatch(currentUser, preferences); },
                },
                { title: t("logOut"), icon: "logout", type: OptionType.NAVIGATE, onPress: () => { logOut(); } },
            ],
        },
        {
            title: t("display"),
            showTitle: true,
            items: [
                {
                    title: t("timezoneOffset"), icon: "access-time", type: OptionType.NAVIGATE,
                    description: t("timezoneOffsetDescription"),
                    onPress: () => setIsTimezoneModalOpen(true),
                },
                {
                    title: t("hideMap"), icon: "map", type: OptionType.SWITCH,
                    switchValue: preferences.hideMap, description: t("hideMapDescription"),
                    onPress: toggle('hideMap'),
                },
            ],
        },
        {
            title: t("car"),
            showTitle: true,
            items: [
                {
                    title: t("useMiles"), icon: "directions-car", type: OptionType.SWITCH,
                    switchValue: preferences.displayMiles,
                    onPress: toggle('displayMiles'),
                },
                {
                    title: t("convertToMiles"), icon: "signpost", type: OptionType.SWITCH,
                    switchValue: preferences.convertToMiles, description: t("convertToMilesDescription"),
                    visible: preferences.displayMiles,
                    onPress: toggle('convertToMiles'),
                },
                {
                    title: t("colourDCCharging"), icon: "ev-plug-ccs2", type: OptionType.SWITCH,
                    switchValue: preferences.highlightDCCharges, useMaterialCommunityIcon: true,
                    onPress: toggle('highlightDCCharges'),
                },
                {
                    title: t("displayChargingPower"), icon: "bolt", type: OptionType.SWITCH,
                    switchValue: preferences.displayChargingPower,
                    onPress: toggle('displayChargingPower'),
                },
                {
                    title: t("mergeCharges"), icon: "merge", type: OptionType.SWITCH,
                    switchValue: preferences.mergeCharges, description: t("mergeChargesDescription"),
                    onPress: toggle('mergeCharges'),
                },
            ],
        },
        {
            title: t("DEBUG"),
            showTitle: true,
            items: [
                { title: "export widget logs", icon: "newspaper", type: OptionType.NAVIGATE, onPress: () => { exportWidgetLogs(); } },
                { title: "Debug zone", icon: "adb", type: OptionType.NAVIGATE, onPress: () => setIsDebugZoneOpen(true) },
            ],
        },
    ];

    return {
        sections,
        timezoneOffset: preferences.scheduledChargeOffset,
        isTimezoneModalOpen,
        closeTimezoneModal: () => setIsTimezoneModalOpen(false),
        selectTimezoneOffset,
        isDebugZoneOpen,
        setIsDebugZoneOpen,
    };
}
