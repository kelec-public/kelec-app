import { ActivityIndicator, Image, StyleSheet, useColorScheme, View } from "react-native";
import { getBlackColour, getWhiteColour } from "../../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WeatherApiHandler } from "../../../../../../lib/clients/weather/weatherClient";
import Text from "../../../../../Common/CustomText";

type Props = {
    weatherHandler: WeatherApiHandler | undefined | null;
}

const WeatherMapCard = ({ weatherHandler }: Props): React.JSX.Element => {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View
            style={[styles.smallButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
            {weatherHandler === undefined && (
                <ActivityIndicator size="small" color={getBlackColour(isDarkMode)} />
            )}
            {weatherHandler === null && (
                <Icon name="error" color={getBlackColour(isDarkMode)} size={20}></Icon>
            )}
            {weatherHandler !== undefined && weatherHandler !== null && (
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Image source={{ uri: weatherHandler.getWeatherIcon() }} style={{ width: 20, height: 20 }} />
                        <Text>{weatherHandler.getTemperatureC()}°</Text>
                    </View>
                </View>
            )}
        </View>
    )
};

const styles = StyleSheet.create({
    smallButton: {
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

export default WeatherMapCard;