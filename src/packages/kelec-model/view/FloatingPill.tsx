import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle, useColorScheme } from "react-native";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { getLightGray, getWhiteColour } from "../../../lib/graphics/utils";

/** Taille d'icône à utiliser dans une pastille. */
export const FLOATING_PILL_ICON_SIZE = 20;
const PADDING = 10;
const BORDER = 2;
/** Teinte du verre sélectionné : translucide, une couleur opaque masquerait l'effet. */
const SELECTED_GLASS_TINT = { light: 'rgba(0,0,0,0.18)', dark: 'rgba(255,255,255,0.3)' };
/** Hauteur minimale de toute pastille (et taille d'une pastille ronde), déduite de l'icône. */
export const FLOATING_PILL_SIZE = FLOATING_PILL_ICON_SIZE + 2 * PADDING + 2 * BORDER;

type Props = {
    readonly children: React.ReactNode;
    readonly onPress?: () => void;
    /** testID du bouton (si `onPress`) ; la pastille elle-même reçoit `viewTestID`. */
    readonly testID?: string;
    readonly viewTestID?: string;
    /** Icône seule : pastille ronde de taille FLOATING_PILL_SIZE. */
    readonly round?: boolean;
    readonly selected?: boolean;
    readonly style?: StyleProp<ViewStyle>;
}

/**
 * Pastille flottante, posée par-dessus une carte ou une image : liquid glass sur iOS 26+,
 * fond blanc et ombre ailleurs.
 * Toutes les pastilles ont au moins la même hauteur (FLOATING_PILL_SIZE) ; dans une ligne en
 * `alignItems: 'stretch'`, une pastille avec du texte plus haut entraîne les autres pastilles à texte.
 * Les pastilles rondes gardent toujours leur taille (pas d'étirement, pour rester rondes).
 */
function FloatingPill({ children, onPress, testID, viewTestID, round = false, selected = false, style }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const commonStyle = [
        styles.pill,
        round ? styles.round : styles.withText,
        onPress && !round && styles.fillTouchable,
    ];

    const pill = isLiquidGlassSupported ? (
        // le verre dessine son propre fond et son ombre ; la sélection passe par la teinte
        <LiquidGlassView
            testID={viewTestID}
            style={[commonStyle, styles.glass, !round && styles.glassWithText, style]}
            tintColor={selected ? SELECTED_GLASS_TINT[isDarkMode ? 'dark' : 'light'] : undefined}
            colorScheme={isDarkMode ? 'dark' : 'light'}
            interactive={onPress !== undefined}
        >
            {children}
        </LiquidGlassView>
    ) : (
        <View
            testID={viewTestID}
            style={[
                commonStyle,
                styles.opaque,
                {
                    borderColor: selected ? 'gray' : 'transparent',
                    backgroundColor: selected ? getLightGray(isDarkMode) : getWhiteColour(isDarkMode),
                },
                style,
            ]}
        >
            {children}
        </View>
    );

    if (!onPress) return pill;

    return (
        <TouchableOpacity
            testID={testID}
            onPress={onPress}
            style={round ? styles.roundTouchable : styles.textTouchable}
        >
            {pill}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        borderWidth: BORDER,
    },
    /**
     * Pas de bordure sur le verre : la lib le pose dans le cadre intérieur à la bordure,
     * alors que les enfants sont placés depuis le bord extérieur (contenu décalé de BORDER).
     * Le padding compense pour garder la même taille.
     */
    glass: {
        borderWidth: 0,
    },
    glassWithText: {
        paddingHorizontal: 15 + BORDER,
        paddingVertical: PADDING + BORDER,
    },
    opaque: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
    },
    withText: {
        minHeight: FLOATING_PILL_SIZE,
        paddingHorizontal: 15,
        paddingVertical: PADDING,
    },
    fillTouchable: {
        // dans un bouton (colonne), remplit la hauteur que la ligne parente donne au bouton
        flexGrow: 1,
    },
    round: {
        width: FLOATING_PILL_SIZE,
        height: FLOATING_PILL_SIZE,
    },
    textTouchable: {
        alignSelf: 'stretch',
    },
    roundTouchable: {
        alignSelf: 'center',
    },
});

export default FloatingPill;
