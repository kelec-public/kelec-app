import { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import Text from "../../../screen/Common/CustomText";
import { minutesOfDay, TimeOfDay, timeOfDayFromDate } from "../models/Tariff";

type Props = {
    readonly value: TimeOfDay;
    readonly onChange: (value: TimeOfDay) => void;
    readonly testID: string;
};

/** Heure « HH:MM » : bouton qui ouvre le sélecteur d'heure du système. */
function TimePickerField({ value, onChange, testID }: Props): React.JSX.Element {
    const theme = useTheme();
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    const minutes = minutesOfDay(value);
    const asDate = new Date();
    asDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

    const open = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: asDate,
                mode: 'time',
                is24Hour: true,
                onChange: (_, selected) => { if (selected) onChange(timeOfDayFromDate(selected)); },
            });
        } else {
            setIsPickerVisible(true);
        }
    };

    return (
        <View>
            <TouchableOpacity testID={testID} onPress={open} style={[styles.button, { backgroundColor: theme.colors.background }]}>
                <Text style={styles.text}>{value}</Text>
            </TouchableOpacity>
            {isPickerVisible && (
                <DateTimePicker
                    value={asDate}
                    mode="time"
                    is24Hour
                    onChange={(_, selected) => {
                        if (selected) onChange(timeOfDayFromDate(selected));
                        setIsPickerVisible(false);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    text: {
        fontSize: 16,
    },
});

export default TimePickerField;
