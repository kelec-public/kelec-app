import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from '@react-navigation/native';
import commonStyles from '../../../lib/graphics/commonStyle';
import Text from '../../../screen/Common/CustomText';
import { useSettingsController } from "../controllers/useSettingsController";
import DebugZoneView from "./debug/DebugZoneView";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import TimezoneOffsetModal from "./TimezoneOffsetModal";

const pkg = require('../../../../package.json');

/** Onglet « Réglages ». */
function SettingsView(): React.JSX.Element {
    const theme = useTheme();
    const controller = useSettingsController();

    return (
        <>
            <Modal
                animationType="slide"
                visible={controller.isDebugZoneOpen}
                onRequestClose={() => controller.setIsDebugZoneOpen(false)}
            >
                <DebugZoneView setShowDebugZone={controller.setIsDebugZoneOpen} />
            </Modal>
            <TimezoneOffsetModal
                visible={controller.isTimezoneModalOpen}
                selectedOffset={controller.timezoneOffset}
                onSelect={controller.selectTimezoneOffset}
                onClose={controller.closeTimezoneModal}
            />
            <View
                testID='settingsView'
                style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}>
                <ScrollView style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}>
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
