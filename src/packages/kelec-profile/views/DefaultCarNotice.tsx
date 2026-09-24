import { useContext } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour } from "../../../lib/graphics/utils";

type Props = {
    readonly carName: string;
}

/** « <voiture> est sélectionnée par défaut ». */
function DefaultCarNotice({ carName }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);

    return (
        <Text style={[commonStyles.smallText, styles.text]}>
            <View style={{ transform: [{ translateY: 1 }] }}><Icon name="info" size={15} color={getBlackColour(isDarkMode)} /></View>
            {carName}{' '}{languageHandler.getTranslation('isSelectedAsDefault')}</Text>
    );
}

const styles = StyleSheet.create({
    text: {
        marginBottom: 10
    }
});

export default DefaultCarNotice;
