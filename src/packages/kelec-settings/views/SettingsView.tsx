import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useContext } from "react";
import { useTheme } from '@react-navigation/native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import commonStyles from '../../../lib/graphics/commonStyle';
import MainContext from '../../../lib/Contexts/MainContext';
import Text from '../../../screen/Common/CustomText';
import { useSettingsController } from "../controllers/useSettingsController";
import DebugZoneView from "./debug/DebugZoneView";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import ChoiceModal from "./ChoiceModal";

const pkg = require('../../../../package.json');

/** Onglet « Réglages ». */
function SettingsView(): React.JSX.Element {
    const theme = useTheme();
    const controller = useSettingsController();
    const { languageHandler } = useContext(MainContext);

    return (
        <>
            <Modal
                animationType="slide"
                visible={controller.isDebugZoneOpen}
                onRequestClose={() => controller.setIsDebugZoneOpen(false)}
            >
                <SafeAreaProvider>
                    <DebugZoneView setShowDebugZone={controller.setIsDebugZoneOpen} />
                </SafeAreaProvider>
            </Modal>
            <ChoiceModal
                visible={controller.isTimezoneModalOpen}
                title={languageHandler.getTranslation("timezoneOffset")}
                choices={controller.timezoneOffsetChoices}
                selected={controller.timezoneOffset}
                onSelect={controller.selectTimezoneOffset}
                onClose={controller.closeTimezoneModal}
            />
            <ChoiceModal
                visible={controller.isColorThemeModalOpen}
                title={languageHandler.getTranslation("colorTheme")}
                choices={controller.colorThemeChoices}
                selected={controller.colorTheme}
                onSelect={controller.selectColorTheme}
                onClose={controller.closeColorThemeModal}
            />
            <View
                testID='settingsView'
                style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}>
                <ScrollView
                    style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}
                    // iOS : le haut (barre d'état) et le bas (barre d'onglets flottante) sont gérés par la ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <SettingsHeader />
                    <View style={styles.sections}>
                        {controller.sections.map(section => (
                            <SettingsSection key={section.title} section={section} />
                        ))}
                        <Text testID="appVersion" style={styles.versionText}>Kelec {pkg.version}</Text>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    sections: {
        gap: 15,
        marginBottom: 40,
        paddingHorizontal: 15,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 16,
    }
});

export default SettingsView;
