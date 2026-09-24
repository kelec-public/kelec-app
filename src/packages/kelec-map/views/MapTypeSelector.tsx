import { StyleSheet, View, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MapType } from "react-native-maps";
import { getBlackColour } from "../../../lib/graphics/utils";
import FloatingPill, { FLOATING_PILL_ICON_SIZE } from "../../kelec-model/view/FloatingPill";
import { SATELLITE_MAP_TYPE } from "../services/mapLinks";

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
        <View style={styles.row}>
            {OPTIONS.map(option => (
                <FloatingPill
                    key={option.testID}
                    testID={option.testID}
                    viewTestID={option.testID + 'View'}
                    onPress={() => onSelect(option.mapType)}
                    selected={selected === option.mapType}
                    round
                >
                    <Icon name={option.icon} color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                </FloatingPill>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        gap: 10,
    },
});

export default MapTypeSelector;
