import { StyleProp, TouchableOpacity, View, ViewStyle, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { getBlackColour } from "../../../lib/graphics/utils";

const DISABLED_OPACITY = 0.4;

type Props = {
    readonly icon: string;
    readonly iconSize: number;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly disabled?: boolean;
    /** Forme du verre (padding, borderRadius) : iOS 26+. Pas de bordure (le verre se poserait dans le cadre intérieur). */
    readonly glassStyle?: StyleProp<ViewStyle>;
    /** Rendu sans liquid glass (Android, iOS < 26). */
    readonly fallbackStyle?: StyleProp<ViewStyle>;
    /** Couleur de l'icône sans liquid glass ; par défaut, la couleur du texte. */
    readonly fallbackIconColour?: string;
}

/** Bouton icône : liquid glass sur iOS 26+, `fallbackStyle` ailleurs. */
function GlassButton({ icon, iconSize, onPress, testID, disabled = false, glassStyle, fallbackStyle, fallbackIconColour }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const textColour = getBlackColour(isDarkMode);

    if (!isLiquidGlassSupported) {
        return (
            <TouchableOpacity
                testID={testID}
                disabled={disabled}
                onPress={onPress}
                style={[fallbackStyle, { opacity: disabled ? DISABLED_OPACITY : 1 }]}
            >
                <Icon name={icon} size={iconSize} color={fallbackIconColour ?? textColour} />
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
                style={glassStyle}
                interactive={!disabled}
                colorScheme={isDarkMode ? 'dark' : 'light'}
            >
                <View pointerEvents="none">
                    <Icon name={icon} size={iconSize} color={textColour} />
                </View>
            </LiquidGlassView>
        </TouchableOpacity>
    );
}

export default GlassButton;
