import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import { useTheme } from '@react-navigation/native';
import { getBlackColour } from "../../../../lib/graphics/utils";
import Text from "../../../../screen/Common/CustomText";
import { Filter, FilterNumerical } from "../../models/Filter";
import { useNumericalFilterController } from "../../controllers/useNumericalFilterController";

type Props = {
    readonly filter: Filter;
    readonly filterValueMin?: number; // si le filtre est déjà appliqué
    readonly filterValueMax?: number; // si le filtre est déjà appliqué
}

function FilterNumericalCard({ filter, filterValueMin, filterValueMax }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { min, max, unit } = filter.filterType as FilterNumerical;
    const { minValue, maxValue, onMinChange, onMaxChange } = useNumericalFilterController(filter, filterValueMin, filterValueMax);

    const renderInput = (side: 'left' | 'right', value: string, onChangeText: (text: string) => void, placeholder: number) => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
                <TextInput
                    style={[styles.input, { color: getBlackColour(isDarkMode) }]}
                    keyboardType="numeric"
                    value={value}
                    testID={side + "TextInput" + filter.filterName}
                    onChangeText={onChangeText}
                    placeholder={placeholder + ''}
                />
                <Text style={{ color: getBlackColour(isDarkMode) }}>{unit}</Text>
            </View>
        </View>
    );

    return (
        <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}
            testID={"expanded" + filter.filterName}>
            {renderInput('left', minValue, onMinChange, min)}
            {renderInput('right', maxValue, onMaxChange, max)}
        </View>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 5,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        padding: 10,
        width: 70,
        marginRight: 10,
        textAlign: 'center',
    },
});

export default FilterNumericalCard;
