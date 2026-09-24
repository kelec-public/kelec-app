import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import commonStyles from "../../../lib/graphics/commonStyle";

type Props = {
    readonly testID: string;
    readonly icon: React.ReactNode;
    readonly label: string;
    readonly onPress: () => void;
    readonly fitLabel?: boolean; // réduit le texte pour tenir sur 2 lignes
}

/** Bouton icône + libellé d'une ligne voiture. */
function CarRowAction({ testID, icon, label, onPress, fitLabel = false }: Props): React.JSX.Element {
    return (
        <TouchableOpacity testID={testID} onPress={onPress}>
            <View style={styles.action}>
                {icon}
                <Text
                    style={{ textAlign: 'center' }}
                    {...(fitLabel ? { numberOfLines: 2, adjustsFontSizeToFit: true } : {})}
                >{label}</Text>
            </View>
        </TouchableOpacity>
    );
}

/** Emplacement d'une action (reste en place même vide, pour garder l'alignement). */
export function ActionSlot({ children }: { readonly children?: React.ReactNode }): React.JSX.Element {
    return <View style={[commonStyles.centerFlex, styles.action]}>{children}</View>;
}

const styles = StyleSheet.create({
    action: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default CarRowAction;
