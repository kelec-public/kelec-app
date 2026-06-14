import React, { useContext, useState } from "react";
import {
    Alert,
    Linking, Modal,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";

import commonStyles from '../../../lib/graphics/commonStyle';
import Icon from "react-native-vector-icons/MaterialIcons";

import {
    getBlackColour,
    getGrayBackgroundColour,
    getMainInterfaceBackground,
    getTopDarkColour,
} from '../../../lib/graphics/utils';

import MainContext from '../../../lib/Contexts/MainContext';

import Text from '../../Common/CustomText';

import SettingRow, { OptionType } from './SettingRow';

import {
    getWidgetsLogs,
    saveNativePreferences,
    sendDataToAppleWatch,
} from '../../../lib/storage/sharedPlatformsData';

import { DocumentDirectoryPath, writeFile } from 'react-native-fs';
import DebugZoneView from "./DebugZone/DebugZoneView";
import BigButton, { ButtonColours } from "../../Common/BigButton";
import TopSettingsView from "./TopSettingsView";
import { RenaultCredentials } from "../../../lib/clients/carMakers/renaultCredentials";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Setting = {
    title: string;
    items: {
        testID?: string;
        icon: string;
        title: string;
        description?: string;
        onPress?: () => void;
        type: OptionType;
        switchValue?: boolean;
        dependency?: string;
        shouldUseMaterialIcon?: boolean;
    }[];
};

function SettingsView(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { currentUser, languageHandler, reloadUser, storageHandler, appPreferences, reloadAppPreferences, checkOnboarding } = useContext(MainContext);

    const [showDebugZone, setShowDebugZone] = useState(false);
    const pkg = require('../../../../package.json');

    const [showSelectTimeZoneModal, setShowSelectTimeZoneModal] = useState(false);

    const settings: Setting[] = [
        {
            title: languageHandler.getTranslation("general"),
            items: [
                {
                    title: languageHandler.getTranslation("sendFeedback"),
                    icon: "feedback",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            Linking.openURL('mailto:contact@kelec.app?subject=Kelec Feedback')
                        })();
                    }
                },
                {
                    title: languageHandler.getTranslation("helpTranslateTheApp"),
                    icon: "language",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            Linking.openURL('https://translate.kelec.app')
                        })();
                    }
                },
                {
                    title: languageHandler.getTranslation("joinDiscord"),
                    icon: "group",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            Linking.openURL('https://discord.gg/ntJayVBYGV')
                        })();
                    }
                },
                {
                    title: languageHandler.getTranslation("syncWithAppleWatch"),
                    icon: "watch",
                    type: OptionType.NAVIGATE,
                    description: languageHandler.getTranslation("watchOnForeground"),
                    onPress: () => {
                        (async () => {
                            // on récupère le cookieValue d'abord
                            const allEmails: string[] = currentUser.getCars().map(car => car.getEmail());
                            const cookieValue = await RenaultCredentials.getAllCookieValues(allEmails);
                            sendDataToAppleWatch(currentUser, appPreferences, cookieValue);
                        })();
                    }
                },
                {
                    title: languageHandler.getTranslation("logOut"),
                    icon: "logout",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            await storageHandler.logOut();
                            checkOnboarding();
                            reloadUser();
                        })();
                    }
                }
            ]
        },
        {
            title: languageHandler.getTranslation("display"),
            items: [
                {
                    title: languageHandler.getTranslation("timezoneOffset"),
                    icon: "access-time",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            setShowSelectTimeZoneModal(true);
                        })();
                    },
                    description: languageHandler.getTranslation("timezoneOffsetDescription"),
                },
                /* {
                    title: languageHandler.getTranslation("useNewInterface"),
                    icon: "phonelink-setup",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.setUseNewInterface(!appPreferences.getUseNewInterface());
                            await storageHandler.setAppPreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.getUseNewInterface(),
                }, */
                {
                    title: languageHandler.getTranslation("hideMap"),
                    icon: "map",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.hideMap = !appPreferences.hideMap;
                            await storageHandler.setAppPreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.hideMap,
                    description: languageHandler.getTranslation("hideMapDescription"),
                }
            ]
        },
        {
            title: languageHandler.getTranslation("car"),
            items: [
                {
                    title: languageHandler.getTranslation("useMiles"),
                    icon: "directions-car",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.displayMiles = !appPreferences.displayMiles;
                            if (!appPreferences.displayMiles) {
                                appPreferences.convertToMiles = false;
                            }
                            await storageHandler.setAppPreferences(appPreferences);
                            // store native preferences
                            saveNativePreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.displayMiles,
                },
                {
                    title: languageHandler.getTranslation("convertToMiles"),
                    icon: "signpost",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.convertToMiles = !appPreferences.convertToMiles;
                            await storageHandler.setAppPreferences(appPreferences);
                            // store native preferences
                            saveNativePreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.convertToMiles,
                    description: languageHandler.getTranslation("convertToMilesDescription"),
                    dependency: languageHandler.getTranslation("useMiles")
                },
                {
                    title: languageHandler.getTranslation("colourDCCharging"),
                    icon: "ev-plug-ccs2",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.highlightDCCharges = !appPreferences.highlightDCCharges;
                            await storageHandler.setAppPreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.highlightDCCharges,
                    shouldUseMaterialIcon: true
                },
                {
                    title: languageHandler.getTranslation("displayChargingPower"),
                    icon: "bolt",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.displayChargingPower = !appPreferences.displayChargingPower;
                            await storageHandler.setAppPreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.displayChargingPower
                },
                {
                    title: languageHandler.getTranslation("mergeCharges"),
                    icon: "merge",
                    type: OptionType.SWITCH,
                    onPress: () => {
                        (async () => {
                            // update the app preferences
                            appPreferences.mergeCharges = !appPreferences.mergeCharges;
                            await storageHandler.setAppPreferences(appPreferences);
                            reloadAppPreferences();
                        })();
                    },
                    switchValue: appPreferences.mergeCharges,
                    description: languageHandler.getTranslation("mergeChargesDescription"),
                },
            ]
        },
        {
            title: languageHandler.getTranslation("DEBUG"),
            items: [
                {
                    title: "export widget logs",
                    icon: "newspaper",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        (async () => {
                            // fetch the widgetsLogs
                            const widgetsLogs = await getWidgetsLogs();
                            if (widgetsLogs === null) {
                                Alert.alert('No logs found');
                                return;
                            }
                            const path = `${DocumentDirectoryPath}/exportLogs.json`;
                            try {
                                await writeFile(path, widgetsLogs, 'utf8');

                                Share.share({
                                    url: 'file://' + path,
                                })
                                    .then(res => {
                                        console.log(res);
                                    })
                                    .catch(err => {
                                        Alert.alert('Erreur 2');
                                        err && console.log(err);
                                    });

                            } catch (e) {
                                Alert.alert('Erreur 1 : ' + e);
                            }
                        })();
                    },
                },
                {
                    title: "Debug zone",
                    icon: "adb",
                    type: OptionType.NAVIGATE,
                    onPress: () => {
                        setShowDebugZone(true);
                    }
                }
            ]
        }
    ]

    const buildSettingRows = () => {
        return settings.map((setting, index) => {
            return (
                <View key={setting.title}>
                    {setting.title === languageHandler.getTranslation("general") ? null : (
                        <Text style={[commonStyles.listText]}>{setting.title.toUpperCase()}</Text>
                    )}
                    <View style={[styles.settingsRowWrapper, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                        {setting.items.map((item, index) => {
                            // skip converting to miles if miles are not displayed
                            if (item.title == languageHandler.getTranslation("convertToMiles") && !appPreferences.displayMiles) {
                                return null;
                            }
                            return (
                                <View key={item.title}>
                                    <SettingRow testID={'testSettingRow' + item.icon} title={item.title} icon={item.icon} type={item.type} description={item.description} onPress={item.onPress} switchValue={item.switchValue} shouldUseMaterialIcon={item.shouldUseMaterialIcon} />
                                    {index === setting.items.length - 1 ? null : <View style={commonStyles.navSeparator}></View>}
                                </View>
                            )
                        })}
                    </View>
                </View>
            )
        });
    }

    const buildTimeZoneRows = (): React.ReactNode => {
        const timeZoneList = [];
        for (let i = -5; i <= 5; i++) {
            const elem = (
                <TouchableOpacity
                    key={i}
                    onPress={() => {
                        appPreferences.scheduledChargeOffset = i;
                        storageHandler.setAppPreferences(appPreferences);
                        reloadAppPreferences();
                        setShowSelectTimeZoneModal(false);
                    }}
                    testID={"timezoneOffsetButton" + i}
                    style={{ backgroundColor: (i == appPreferences.scheduledChargeOffset) ? getTopDarkColour(isDarkMode) : getGrayBackgroundColour(isDarkMode), borderRadius: 10 }}
                >
                    <View style={[commonStyles.rowFlex, styles.paddingHorizontal, { justifyContent: 'space-between' }]}>
                        <Text>{i}</Text>
                        <Icon name="chevron-right" size={20} color={getBlackColour(isDarkMode)} />
                    </View>
                </TouchableOpacity>);
            timeZoneList.push(elem);
            if (i !== 5) {
                timeZoneList.push(<View key={i + 'sep'} style={[commonStyles.navSeparator]}></View>);
            }

        }
        return timeZoneList;
    };
    return (
        <>
            {/* temp for debug zone*/}
            <Modal
                animationType="slide"
                visible={showDebugZone}
                onRequestClose={() => {
                    setShowDebugZone(false);
                }}
            >
                <SafeAreaProvider>
                    <DebugZoneView setShowDebugZone={setShowDebugZone} />
                </SafeAreaProvider>
            </Modal>
            {/* temp for debug zone*/}
            {/* modal for timezime selection */}
            <Modal
                animationType="slide"
                visible={showSelectTimeZoneModal}
                onRequestClose={() => {
                    setShowSelectTimeZoneModal(false);
                }}
            >
                <SafeAreaProvider>
                    <SafeAreaView
                        style={
                            [
                                {
                                    backgroundColor: getGrayBackgroundColour(isDarkMode),
                                    flex: 1,
                                    justifyContent: 'space-between',

                                },
                            ]}>
                        <View style={styles.mainViewContent}>
                            <Text style={styles.topTitleMedium}>{languageHandler.getTranslation("timezoneOffset")}</Text>
                            <ScrollView >
                                <View style={{ gap: 5 }}>
                                    {buildTimeZoneRows()}
                                </View>
                            </ScrollView>
                        </View>
                        <View style={{ paddingHorizontal: 15, marginBottom: 20 }}>
                            <BigButton
                                testID='addBackButton'
                                text={languageHandler.getTranslation("back")}
                                onPress={() => setShowSelectTimeZoneModal(false)}
                                colour={ButtonColours.PRIMARY}
                            />
                        </View>
                    </SafeAreaView>
                </SafeAreaProvider>
            </Modal>
            <View
                testID='settingsView'
                style={[commonStyles.flex, { backgroundColor: getMainInterfaceBackground(isDarkMode) }]}>

                <ScrollView style={[commonStyles.flex, styles.mainWrapper, { backgroundColor: getMainInterfaceBackground(isDarkMode) }]}>
                    <TopSettingsView />

                    <View style={[styles.elements, { paddingHorizontal: 15 }]}>
                        {buildSettingRows()}
                        <Text testID="appVersion" style={styles.versionText}>Kelec {pkg.version}</Text>
                    </View>
                </ScrollView>

            </View>
        </>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
    },
    marginVertical: {
        marginVertical: 10
    },
    paddingHorizontal: {
        paddingHorizontal: 15,
        marginVertical: 10
    },
    mainViewContent: {
        paddingHorizontal: 15,
    },
    topTitleMedium: {
        fontSize: 20,
        marginBottom: 10,
    },
    settingsRowWrapper: {
        marginTop: 10,
    },
    elements: {
        gap: 15,
        marginBottom: 40
    },
    versionText: {
        textAlign: 'center',
        fontSize: 16,
    }
});
export default SettingsView;
