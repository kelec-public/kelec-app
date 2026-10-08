import { ActivityIndicator, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import { BLACK_COLOUR, NEUTRAL_100, NEUTRAL_200, NEUTRAL_450, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, title2 } from "../../kelec-model/view/Titles";

type Props = {
    /** Textes déjà traduits. */
    readonly title: string;
    readonly subtitle: string;
    /** Nom du fichier déjà choisi, s'il y en a un. */
    readonly fileName: string | null;
    readonly isLoading: boolean;
    readonly onPress: () => void;
};

/** Zone pour choisir le fichier à importer. */
function ImportFilePickerCard({ title, subtitle, fileName, isLoading, onPress }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <TouchableOpacity testID="filePickerCard" onPress={onPress} disabled={isLoading} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? NEUTRAL_450 : NEUTRAL_100 }]}>
                {isLoading
                    ? <ActivityIndicator color={PRIMARY_COLOUR} />
                    : <Icon name={fileName ? "description" : "upload-file"} size={26} color={PRIMARY_COLOUR} />}
            </View>
            <Text style={[title2, styles.centered]}>{title}</Text>
            <Text style={[subTitle2, styles.centered, { color: BLACK_COLOUR(isDarkMode) }]} testID="filePickerCardSubtitle">
                {fileName ?? subtitle}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        gap: spacerS,
        padding: spacerXL,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: NEUTRAL_200,
        borderRadius: spacerM,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacerS,
    },
    centered: {
        textAlign: 'center',
    },
});

export default ImportFilePickerCard;
