import { StyleSheet, useColorScheme, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { NEUTRAL_100, NEUTRAL_300, NEUTRAL_450, PRIMARY_COLOUR, SECONDARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerM, spacerS } from "../../kelec-model/view/Spacers";
import { subTitle3 } from "../../kelec-model/view/Titles";

type Props = {
    /** Texte déjà traduit. */
    readonly text: string;
    /** `success` : vert (tarif actif, économie) ; `neutral` : gris. */
    readonly variant?: 'success' | 'neutral';
    /** Pastille devant le texte (ex. « Actif en ce moment »). */
    readonly withDot?: boolean;
    readonly testID?: string;
};

/** Petite étiquette arrondie. */
function Badge({ text, variant = 'success', withDot = false, testID }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const isSuccess = variant === 'success';
    const backgroundColor = isSuccess ? PRIMARY_COLOUR + '26' : (isDarkMode ? NEUTRAL_450 : NEUTRAL_100);
    const color = isSuccess ? SECONDARY_COLOUR : NEUTRAL_300;
    return (
        <View testID={testID} style={[styles.badge, { backgroundColor }]}>
            {withDot && <View style={[styles.dot, { backgroundColor: color }]} />}
            <Text style={[subTitle3, { color }]}>{text}</Text>
        </View>
    );
}

const DOT = 6;

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacerS,
        borderRadius: 999,
        paddingVertical: spacerS,
        paddingHorizontal: spacerM,
    },
    dot: {
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
    },
});

export default Badge;
