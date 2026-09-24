import { StyleSheet, View, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getGrayBackgroundColour } from "../../../lib/graphics/utils";
import { SettingSection } from "../controllers/settingsTypes";
import SettingRow from "./SettingRow";

type Props = {
    readonly section: SettingSection;
}

function SettingsSection({ section }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View>
            {section.showTitle && (
                <Text style={[commonStyles.listText]}>{section.title.toUpperCase()}</Text>
            )}
            <View style={[styles.rows, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                {section.items.map((item, index) => {
                    if (item.visible === false) return null;
                    return (
                        <View key={item.title}>
                            <SettingRow
                                testID={'testSettingRow' + item.icon}
                                title={item.title}
                                icon={item.icon}
                                type={item.type}
                                description={item.description}
                                onPress={item.onPress}
                                switchValue={item.switchValue}
                                shouldUseMaterialIcon={item.useMaterialCommunityIcon}
                            />
                            {index === section.items.length - 1 ? null : <View style={commonStyles.navSeparator}></View>}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rows: {
        marginTop: 10,
    },
});

export default SettingsSection;
