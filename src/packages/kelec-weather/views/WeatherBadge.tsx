import { ActivityIndicator, Image, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlackColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";
import FloatingPill, { FLOATING_PILL_ICON_SIZE } from "../../kelec-model/view/FloatingPill";
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
                return <Icon name="error" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>;
            case 'loaded': {
                const { temperatureC, iconUrl } = state.weather;
                if (temperatureC === null || iconUrl === null) return null;
                return (
                    <>
                        <Image source={{ uri: iconUrl }} style={{ width: FLOATING_PILL_ICON_SIZE, height: FLOATING_PILL_ICON_SIZE }} />
                        <Text>{temperatureC}°</Text>
                    </>
                );
            }
        }
    };

    return (
        <FloatingPill viewTestID="weatherBadge">
            {renderContent()}
        </FloatingPill>
    );
};

export default WeatherBadge;
