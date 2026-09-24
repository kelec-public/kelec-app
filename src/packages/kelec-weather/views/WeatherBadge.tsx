import { ActivityIndicator, Image, StyleSheet, useColorScheme, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlackColour, getWhiteColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";
import { WeatherState } from "../models/Weather";

type Props = {
    readonly state: WeatherState;
}

/** Pastille météo : chargement, erreur, ou icône + température. */
const WeatherBadge = ({ state }: Props): React.JSX.Element => {
    const isDarkMode = useColorScheme() === 'dark';

    const renderContent = () => {
        switch (state.status) {
            case 'loading':
                return <ActivityIndicator size="small" color={getBlackColour(isDarkMode)} />;
            case 'error':
                return <Icon name="error" color={getBlackColour(isDarkMode)} size={20}></Icon>;
            case 'loaded': {
                const { temperatureC, iconUrl } = state.weather;
                if (temperatureC === null || iconUrl === null) return null;
                return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Image source={{ uri: iconUrl }} style={{ width: 20, height: 20 }} />
                        <Text>{temperatureC}°</Text>
                    </View>
                );
            }
        }
    };

    return (
        <View testID="weatherBadge" style={[styles.badge, { backgroundColor: getWhiteColour(isDarkMode) }]}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 999,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        gap: 5,
    }
});

export default WeatherBadge;
