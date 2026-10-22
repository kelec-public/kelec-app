import { StyleSheet, useColorScheme, View } from "react-native";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import { getBlackColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";
import GlassButton from "./GlassButton";

const ICON_SIZE = 30;
const BUTTON_PADDING = 4;

export type PageHeaderAction = {
    readonly icon: string;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly disabled?: boolean;
};

type Props = {
    /** Titre déjà traduit. */
    readonly title: string;
    readonly onBack: () => void;
    readonly backTestID?: string;
    /** Bouton à droite (ex. options, ajouter, valider). Sans action, un espace vide garde le titre centré. */
    readonly action?: PageHeaderAction;
};

/** En-tête d'une page poussée : retour en verre à gauche, titre centré, action en verre facultative à droite. */
const PageHeader = ({ title, onBack, backTestID = "backButton", action }: Props) => {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View style={[commonStyles.rowFlex, commonStyles.spaceBetween, commonStyles.paddingHorizontal]}>
            <GlassButton
                testID={backTestID}
                icon="chevron-left"
                iconSize={ICON_SIZE}
                onPress={onBack}
                glassStyle={styles.glassButton}
            />
            <Text style={[styles.titleText, { color: getBlackColour(isDarkMode) }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
            {action ? (
                <GlassButton
                    testID={action.testID}
                    icon={action.icon}
                    iconSize={ICON_SIZE}
                    onPress={action.onPress}
                    disabled={action.disabled}
                    glassStyle={styles.glassButton}
                />
            ) : (
                <View style={styles.emptyAction} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    glassButton: {
        padding: BUTTON_PADDING,
        borderRadius: 999,
    },
    titleText: {
        textAlign: 'center',
        paddingHorizontal: 10,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
        fontSize: 25,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    emptyAction: {
        width: ICON_SIZE + 2 * BUTTON_PADDING,
    },
});

export default PageHeader;
