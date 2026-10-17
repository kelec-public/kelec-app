import { StyleProp, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { getBlackColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";

const DISABLED_OPACITY = 0.4;
/** Teinte du verre sélectionné : translucide, une couleur opaque masquerait l'effet. */
const SELECTED_GLASS_TINT = { light: 'rgba(0,0,0,0.18)', dark: 'rgba(255,255,255,0.3)' };

/** Teinte du verre : SELECTED_GLASS_TINT si sélectionné, aucune sinon. */
export const getSelectedGlassTint = (selected: boolean, isDarkMode: boolean): string | undefined => {
    if (!selected) return undefined;
    return isDarkMode ? SELECTED_GLASS_TINT.dark : SELECTED_GLASS_TINT.light;
};

type Props = {
    readonly icon: string;
    /** Famille de l'icône : MaterialIcons par défaut, ou MaterialCommunityIcons. */
    readonly iconFamily?: 'material' | 'community';
    readonly iconSize: number;
    readonly iconTestID?: string;
    readonly iconStyle?: StyleProp<TextStyle>;
    readonly text?: string;
    readonly textStyle?: StyleProp<TextStyle>;
    /** Icône avant ou après le texte (après par défaut). */
    readonly iconPosition?: 'start' | 'end';
    readonly onPress: () => void;
    readonly testID?: string;
    readonly disabled?: boolean;
    /** Sur le verre : teinte SELECTED_GLASS_TINT. Sans verre, c'est à `fallbackStyle` de le montrer. */
    readonly selected?: boolean;
    /** Forme du verre (padding, borderRadius) : iOS 26+. Pas de bordure (le verre se poserait dans le cadre intérieur). */
    readonly glassStyle?: StyleProp<ViewStyle>;
    /** Rendu sans liquid glass (Android, iOS < 26). */
    readonly fallbackStyle?: StyleProp<ViewStyle>;
    /** Couleur de l'icône sans liquid glass ; par défaut, la couleur du texte. */
    readonly fallbackIconColour?: string;
    /** Couleur du texte sans liquid glass ; par défaut, celle du thème. */
    readonly fallbackTextColour?: string;
}

/** Bouton icône (avec texte éventuel) : liquid glass sur iOS 26+, `fallbackStyle` ailleurs. */
function GlassButton(props: Props): React.JSX.Element {
    const { icon, iconFamily = 'material', iconSize, iconTestID, iconStyle, text, textStyle, iconPosition = 'end', onPress, testID, disabled = false, selected = false, glassStyle, fallbackStyle, fallbackIconColour, fallbackTextColour } = props;
    const isDarkMode = useColorScheme() === 'dark';
    const textColour = getBlackColour(isDarkMode);
    const IconComponent = iconFamily === 'community' ? CommunityIcon : Icon;

    const renderContent = (iconColour: string, textColourOverride?: string) => {
        const iconElement = <IconComponent name={icon} testID={iconTestID} size={iconSize} style={iconStyle} color={iconColour} />;
        return (
            <>
                {iconPosition === 'start' && iconElement}
                {text !== undefined && (
                    <Text style={[textStyle, textColourOverride !== undefined && { color: textColourOverride }]}>{text}</Text>
                )}
                {iconPosition === 'end' && iconElement}
            </>
        );
    };

    if (!isLiquidGlassSupported) {
        return (
            <TouchableOpacity
                testID={testID}
                disabled={disabled}
                onPress={onPress}
                style={[styles.content, fallbackStyle, { opacity: disabled ? DISABLED_OPACITY : 1 }]}
            >
                {renderContent(fallbackIconColour ?? textColour, fallbackTextColour)}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            testID={testID}
            disabled={disabled}
            onPress={onPress}
            // l'effet interactif du verre remplace l'assombrissement au toucher
            activeOpacity={1}
            style={{ opacity: disabled ? DISABLED_OPACITY : 1 }}
        >
            <LiquidGlassView
                style={[styles.content, glassStyle]}
                tintColor={getSelectedGlassTint(selected, isDarkMode)}
                interactive={!disabled}
                colorScheme={isDarkMode ? 'dark' : 'light'}
            >
                <View style={styles.content} pointerEvents="none">
                    {renderContent(textColour, textColour)}
                </View>
            </LiquidGlassView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    content: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default GlassButton;
