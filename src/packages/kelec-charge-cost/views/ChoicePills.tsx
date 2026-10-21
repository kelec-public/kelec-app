import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { BLACK_COLOUR, NEUTRAL_200, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerL, spacerM, spacerS } from "../../kelec-model/view/Spacers";

export type PillChoice<T> = {
    readonly value: T;
    /** Libellé déjà traduit. */
    readonly label: string;
    readonly testID: string;
};

type Props<T> = {
    readonly choices: PillChoice<T>[];
    readonly selected: T;
    readonly onSelect: (value: T) => void;
};

/** Choix d'une valeur parmi quelques-unes, sur une ligne qui défile si elle déborde (grande police). */
function ChoicePills<T>({ choices, selected, onSelect }: Props<T>): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {choices.map(choice => {
                const isSelected = choice.value === selected;
                return (
                    <TouchableOpacity
                        key={choice.testID}
                        testID={choice.testID}
                        onPress={() => onSelect(choice.value)}
                        accessibilityState={{ selected: isSelected }}
                        style={[styles.pill, {
                            borderColor: isSelected ? PRIMARY_COLOUR : NEUTRAL_200,
                            backgroundColor: isSelected ? PRIMARY_COLOUR : 'transparent',
                        }]}
                    >
                        <Text style={{ color: isSelected ? 'white' : BLACK_COLOUR(isDarkMode) }}>{choice.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        gap: spacerS,
    },
    pill: {
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: spacerM,
        paddingHorizontal: spacerL,
    },
});

export default ChoicePills;
