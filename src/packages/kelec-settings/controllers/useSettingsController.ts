import { useCallback, useContext, useState } from "react";
import { Platform } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import MainContext from "../../../lib/Contexts/MainContext";
import ColorTheme from "../../../lib/appPreferences/interface/colorTheme";
import { BooleanPreference, COLOR_THEMES, usePreferences } from "../../kelec-preferences";
import { logOut as clearSession } from "../../kelec-garage";
import { ExternalLinks, openExternalLink } from "../services/externalLinks";
import { syncWithAppleWatch } from "../services/appleWatchSync";
import { exportWidgetLogs } from "../services/widgetLogsExport";
import { OptionType, SettingSection } from "./settingsTypes";
import { TIMEZONE_OFFSETS } from "../services/timezoneOffsets";
import { Choice } from "../views/ChoiceModal";
import { TARIFF_LIST_ROUTE } from "../../kelec-charge-cost";
import { SettingsParamList } from "../routes";

const COLOR_THEME_LABELS: Record<ColorTheme, string> = {
    auto: "colorThemeAuto",
    light: "colorThemeLight",
    dark: "colorThemeDark",
};

/** Onglet Réglages : sections affichées, actions, et modales (fuseau horaire, thème, debug). */
export function useSettingsController() {
    const { currentUser, languageHandler, reloadUser, checkOnboarding } = useContext(MainContext);
    const { preferences, update } = usePreferences();
    const navigation = useNavigation<NavigationProp<SettingsParamList>>();
    const t = (key: string) => languageHandler.getTranslation(key);

    const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
    const [isColorThemeModalOpen, setIsColorThemeModalOpen] = useState(false);
    const [isDebugZoneOpen, setIsDebugZoneOpen] = useState(false);

    const logOut = useCallback(async () => {
        await clearSession(currentUser);
        checkOnboarding();
        reloadUser();
    }, [currentUser, checkOnboarding, reloadUser]);

    const selectTimezoneOffset = useCallback(async (offset: number) => {
        await update({ scheduledChargeOffset: offset });
        setIsTimezoneModalOpen(false);
    }, [update]);

    const selectColorTheme = useCallback(async (colorTheme: ColorTheme) => {
        await update({ colorTheme });
        setIsColorThemeModalOpen(false);
    }, [update]);

    const timezoneOffsetChoices: Choice<number>[] = TIMEZONE_OFFSETS.map(offset => (
        { value: offset, label: String(offset), testID: "timezoneOffsetButton" + offset }
    ));

    const colorThemeChoices: Choice<ColorTheme>[] = COLOR_THEMES.map(theme => (
        { value: theme, label: t(COLOR_THEME_LABELS[theme]), testID: "colorThemeButton" + theme }
    ));

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
                    // Apple Watch sur iOS, montre Wear OS sur Android (même synchro)
                    title: t(Platform.OS === 'ios' ? "syncWithAppleWatch" : "syncWithWearOsWatch"), icon: "watch", type: OptionType.NAVIGATE,
                    description: Platform.OS === 'ios' ? t("watchOnForeground") : undefined,
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
                    title: t("colorTheme"), icon: "dark-mode", type: OptionType.NAVIGATE,
                    description: t(COLOR_THEME_LABELS[preferences.colorTheme]),
                    onPress: () => setIsColorThemeModalOpen(true),
                },
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
            title: t("electricity"),
            showTitle: true,
            items: [
                {
                    title: t("electricityTariff"), icon: "electrical-services", type: OptionType.NAVIGATE,
                    onPress: () => navigation.navigate(TARIFF_LIST_ROUTE),
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
        timezoneOffsetChoices,
        isTimezoneModalOpen,
        closeTimezoneModal: () => setIsTimezoneModalOpen(false),
        selectTimezoneOffset,
        colorTheme: preferences.colorTheme,
        colorThemeChoices,
        isColorThemeModalOpen,
        closeColorThemeModal: () => setIsColorThemeModalOpen(false),
        selectColorTheme,
        isDebugZoneOpen,
        setIsDebugZoneOpen,
    };
}
