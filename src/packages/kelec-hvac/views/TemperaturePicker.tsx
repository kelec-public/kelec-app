import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import { getBlackColour } from "../../../lib/graphics/utils";
import { getTemperatureLabel } from "../models/Temperature";
import { getTemperatureColour, showsDegreeUnit } from "./temperatureStyle";

type Props = {
    readonly temperature: number;
    readonly canDecrease: boolean;
    readonly canIncrease: boolean;
    readonly onDecrease: () => void;
    readonly onIncrease: () => void;
}

function TemperaturePicker({ temperature, canDecrease, canIncrease, onDecrease, onIncrease }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View style={[commonStyles.rowFlex, commonStyles.spaceBetween, styles.marginVertical]}>
            <View style={[commonStyles.centerFlex]}>
                <TouchableOpacity
                    testID="HVACCardLowButton"
                    disabled={!canDecrease}
                    onPress={onDecrease}
                    style={[styles.temperatureButton, { opacity: canDecrease ? 1 : 0.4 }]}
                >
                    <Icon name="remove" size={25} color='black' />
                </TouchableOpacity>
            </View>
            <View style={commonStyles.rowFlex}>
                <Text
                    testID="temperatureText"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.temperatureText, { color: getTemperatureColour(temperature, isDarkMode) }]}
                >{getTemperatureLabel(temperature)}</Text>
                {showsDegreeUnit(temperature) && (
                    <Text testID="degreeText" style={[styles.temperatureText, { color: getBlackColour(isDarkMode) }]}>°C</Text>
                )}
            </View>
            <View style={[commonStyles.centerFlex]}>
                <TouchableOpacity
                    testID="HVACCardHighButton"
                    disabled={!canIncrease}
                    onPress={onIncrease}
                    style={[styles.temperatureButton, { opacity: canIncrease ? 1 : 0.4 }]}
                >
                    <Icon name="add" size={25} color='black' />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    temperatureButton: {
        backgroundColor: 'rgb(220,220,220)',
        padding: 10,
        borderRadius: 10
    },
    temperatureText: {
        fontFamily: fontFamilyBold,
        fontWeight: fontWeightBold,
        fontSize: 60,
    },
    marginVertical: {
        marginTop: 20,
        marginBottom: 20
    }
});

export default TemperaturePicker;
