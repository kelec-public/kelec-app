import { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import { BLACK_COLOUR, NEUTRAL_200 } from "../../kelec-model/lib/colours";
import { spacerL, spacerM, spacerS } from "../../kelec-model/view/Spacers";
import { textBody } from "../../kelec-model/view/Titles";

type Props = {
    readonly mode: 'date' | 'time';
    readonly value: Date;
    /** Valeur affichée, déjà formatée. */
    readonly label: string;
    readonly onChange: (value: Date) => void;
    readonly testID: string;
};

/** Date ou heure : bouton qui ouvre le sélecteur du système. */
function PickerButton({ mode, value, label, onChange, testID }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    const open = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value,
                mode,
                is24Hour: true,
                onChange: (_, selected) => { if (selected) onChange(selected); },
            });
        } else {
            setIsPickerVisible(true);
        }
    };

    return (
        <View>
            <TouchableOpacity testID={testID} onPress={open} style={styles.button}>
                <Text style={textBody}>{label}</Text>
                {mode === 'date' && <Icon name="expand-more" size={spacerL} color={BLACK_COLOUR(isDarkMode)} />}
            </TouchableOpacity>
            {isPickerVisible && (
                <DateTimePicker
                    value={value}
                    mode={mode}
                    is24Hour
                    onChange={(_, selected) => {
                        if (selected) onChange(selected);
                        setIsPickerVisible(false);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerS,
        borderWidth: 1,
        borderColor: NEUTRAL_200,
        borderRadius: 999,
        paddingVertical: spacerM,
        paddingHorizontal: spacerL,
    },
});

export default PickerButton;
