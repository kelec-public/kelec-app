import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MapType } from "react-native-maps";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getLightGray, getWhiteColour } from "../../../lib/graphics/utils";
import { SATELLITE_MAP_TYPE } from "../services/mapLinks";
import { mapButtonStyle } from "./mapButtonStyle";

type Props = {
    readonly selected: MapType;
    readonly onSelect: (mapType: MapType) => void;
}

const OPTIONS: { testID: string; icon: string; mapType: MapType }[] = [
    { testID: 'standardButton', icon: 'map', mapType: 'standard' },
    { testID: 'satelliteButton', icon: 'satellite', mapType: SATELLITE_MAP_TYPE },
];

/** Choix plan / satellite. */
function MapTypeSelector({ selected, onSelect }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View style={[commonStyles.flex, commonStyles.flexEnd, commonStyles.rowFlex]}>
            {OPTIONS.map(option => {
                const isSelected = selected === option.mapType;
                return (
                    <TouchableOpacity key={option.testID} testID={option.testID} onPress={() => onSelect(option.mapType)}>
                        <View
                            testID={option.testID + 'View'}
                            style={[mapButtonStyle.button, {
                                backgroundColor: isSelected ? getLightGray(isDarkMode) : getWhiteColour(isDarkMode),
                                borderColor: isSelected ? 'gray' : 'transparent',
                            }, styles.withBorder, styles.reducedMargin]}
                        >
                            <Icon name={option.icon} color={getBlackColour(isDarkMode)} size={30}></Icon>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    withBorder: {
        borderWidth: 3,
    },
    reducedMargin: {
        marginLeft: 5,
        marginRight: 5,
    },
});

export default MapTypeSelector;
