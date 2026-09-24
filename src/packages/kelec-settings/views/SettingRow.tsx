import { StyleSheet, Switch, TouchableOpacity, View, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialIcon from "react-native-vector-icons/MaterialCommunityIcons";
import commonStyles, { fontFamilyBold } from "../../../lib/graphics/commonStyle";
import { ReactNode } from "react";
import { getBlackColour } from "../../../lib/graphics/utils";
import { OptionType } from "../controllers/settingsTypes";

type SettingRowProps = {
    readonly testID?: string;
    readonly icon: string;
    readonly title: string;
    readonly description?: string;
    readonly onPress?: () => void;
    readonly type: OptionType;
    readonly switchValue?: boolean;
    readonly shouldUseMaterialIcon?: boolean;

}

function SettingRow({ testID, icon, title, description, onPress, type, switchValue, shouldUseMaterialIcon }: SettingRowProps): React.JSX.Element {

    const getRightPartIcon = (): ReactNode => {
        if (type === OptionType.NAVIGATE) {
            return <Icon name="keyboard-arrow-right" size={20} color={getBlackColour(isDarkMode)} />
        } else {
            return <Switch
                value={switchValue}
                onValueChange={onPress}
            />
        }
    }

    const isDarkMode = useColorScheme() === 'dark';

    return (
        <TouchableOpacity
            testID={testID}
            onPress={onPress}
            style={[commonStyles.spaceBetween, commonStyles.rowFlex, commonStyles.gap10, styles.wrapper]}
        >
            <View style={[commonStyles.rowFlex, commonStyles.gap15, commonStyles.centerFlex, { maxWidth: '80%' }]}>
                {shouldUseMaterialIcon ?
                    <MaterialIcon name={icon} color={getBlackColour(isDarkMode)} size={20} />
                    :
                    <Icon name={icon} color={getBlackColour(isDarkMode)} size={20} />
                }

                <View style={[commonStyles.gap5, { flex: 1 }]}>
                    <Text style={styles.title}>{title}</Text>
                    {description ? <Text style={[styles.description]} >{description}</Text> : null}
                </View>
            </View>
            {getRightPartIcon()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontFamily: fontFamilyBold,
        fontWeight: '500'
    },
    description: {
        fontSize: 15,
        color: 'gray',
        flexWrap: 'wrap',
        maxWidth: '80%'
    },
    wrapper: {
        padding: 25,
    }

});

export default SettingRow;
