import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import TextInput from "../../../screen/Common/TextInput";
import { NEUTRAL_200 } from "../../kelec-model/lib/colours";
import { spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, textBody } from "../../kelec-model/view/Titles";

type Props = {
    readonly icon: string;
    /** Couleur de l'icône, aussi utilisée (transparente) pour son fond. */
    readonly iconColour: string;
    /** Libellé déjà traduit. */
    readonly label: string;
    readonly value: string;
    readonly onChangeText: (text: string) => void;
    /** « €/kWh ». */
    readonly unit: string;
    readonly testID: string;
};

/** Prix au kWh : icône, libellé, champ aligné à droite et unité. */
function PriceRow({ icon, iconColour, label, value, onChangeText, unit, testID }: Props): React.JSX.Element {
    return (
        <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: iconColour + '26' }]}>
                <Icon name={icon} size={spacerXL} color={iconColour} />
            </View>
            <Text style={[textBody, styles.label]}>{label}</Text>
            <TextInput
                testID={testID}
                placeholder="0,00"
                value={value}
                onChangeText={onChangeText}
                keyboardType="decimal-pad"
                style={styles.input}
            />
            <Text style={subTitle2}>{unit}</Text>
        </View>
    );
}

const ICON_BOX = 36;

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
    iconBox: {
        width: ICON_BOX,
        height: ICON_BOX,
        borderRadius: spacerS * 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        flex: 1,
        flexWrap: 'wrap',
    },
    input: {
        // la hauteur suit la taille de la police
        height: undefined,
        minHeight: 40,
        width: 90,
        margin: 0,
        borderColor: NEUTRAL_200,
        textAlign: 'right',
    },
});

export default PriceRow;
