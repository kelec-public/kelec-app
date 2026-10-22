import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { spacerS, spacerXL } from "../../kelec-model/view/Spacers";

type Props = {
    readonly icon: string;
    /** Couleur de l'icône, aussi utilisée (transparente) pour le fond. */
    readonly colour: string;
};

/** Icône sur un carré arrondi teinté (prix fixe, heures pleines, heures creuses). */
function IconBox({ icon, colour }: Props): React.JSX.Element {
    return (
        <View style={[styles.box, { backgroundColor: colour + '26' }]}>
            <Icon name={icon} size={spacerXL} color={colour} />
        </View>
    );
}

const SIZE = 36;

const styles = StyleSheet.create({
    box: {
        width: SIZE,
        height: SIZE,
        borderRadius: spacerS * 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default IconBox;
