import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { BLACK_COLOUR, NEUTRAL_200, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerS } from "../../kelec-model/view/Spacers";
import { subTitle2 } from "../../kelec-model/view/Titles";
import { Weekday, WEEKDAYS } from "../models/Tariff";
import { weekdayName } from "../services/offPeakSummary";

type Props = {
    readonly selected: Weekday[];
    readonly onChange: (days: Weekday[]) => void;
    /** Préfixe des `testID` : un bouton par jour, `<testID><jour>` (0 = dimanche). */
    readonly testID: string;
};

/** Jours d'une plage d'heures creuses : une pastille par jour, du lundi au dimanche. Le dernier jour choisi ne se retire pas. */
function DayPicker({ selected, onChange, testID }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const toggle = (day: Weekday) => {
        if (!selected.includes(day)) return onChange([...selected, day]);
        if (selected.length > 1) onChange(selected.filter(other => other !== day));
    };

    return (
        <View style={styles.row}>
            {WEEKDAYS.map(day => {
                const isSelected = selected.includes(day);
                return (
                    <TouchableOpacity
                        key={day}
                        testID={testID + day}
                        accessibilityRole="checkbox"
                        accessibilityLabel={weekdayName(day, 'long')}
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => toggle(day)}
                        style={[styles.day, {
                            borderColor: isSelected ? PRIMARY_COLOUR : NEUTRAL_200,
                            backgroundColor: isSelected ? PRIMARY_COLOUR : 'transparent',
                        }]}
                    >
                        <Text style={[subTitle2, { color: isSelected ? 'white' : BLACK_COLOUR(isDarkMode) }]}>
                            {weekdayName(day, 'narrow')}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const DAY_SIZE = 32;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacerS,
    },
    day: {
        minWidth: DAY_SIZE,
        minHeight: DAY_SIZE,
        paddingHorizontal: spacerS,
        borderWidth: 1,
        borderRadius: DAY_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DayPicker;
