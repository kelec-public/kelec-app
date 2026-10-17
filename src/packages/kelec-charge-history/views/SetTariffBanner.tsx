import { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from "../../../lib/Contexts/MainContext";
import { getBlackColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";

type Props = {
    readonly onPress: () => void;
};

/** En haut de l'historique, tant qu'aucun tarif n'est défini : ouvre les tarifs de l'électricité. */
function SetTariffBanner({ onPress }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const textColour = getBlackColour(isDarkMode);

    return (
        <TouchableOpacity
            testID="setTariffBanner"
            onPress={onPress}
            style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer }]}
        >
            <Icon name="electrical-services" size={20} color={textColour} />
            <Text style={[styles.text, { color: textColour }]}>{languageHandler.getTranslation("setTariffToSeeCosts")}</Text>
            <Icon name="chevron-right" size={20} color={textColour} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 15,
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 7,
    },
    text: {
        flex: 1,
    },
});

export default SetTariffBanner;
