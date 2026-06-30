import React, { useRef } from 'react';
import Text from '../../../screen/Common/CustomText';
import { ActivityIndicator, Animated, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { spacerL, spacerM, spacerXL } from './Spacers';
import { useTheme } from '@react-navigation/native';
import { ButtonStyle, Gradient } from '../../../../theme/buttonStyles';
import LinearGradient from 'react-native-linear-gradient';

type ButtonProps = {
    readonly buttonStyle?: ButtonStyle;
    readonly text?: string;
    readonly onPress: () => void;
    readonly disabled?: boolean;
    readonly isLoading?: boolean;
    readonly testID?: string;
    readonly icon?: string;
}

const isGradient = (value: unknown): value is Gradient =>
    typeof value === 'object' && value !== null && 'startColor' in value;

const getGradientProps = (gradient: Gradient) => ({
    colors: [gradient.startColor, gradient.endColor],
    start: { x: 0, y: 0 },
    end: gradient.orientation === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 },
});

const Button = (props: ButtonProps): React.JSX.Element => {
    const { buttonStyle, text, onPress, disabled, isLoading, testID, icon } = props;

    const theme = useTheme();
    const finalStyle = buttonStyle ?? theme.buttons.primary;

    const pressAnim = useRef(new Animated.Value(0)).current;

    const bg = disabled ? finalStyle.colors.backgroundDisabled : finalStyle.colors.background;
    const bgPressed = finalStyle.colors.backgroundPressed ?? finalStyle.colors.background;

    const txtColors = {
        color: !disabled ? finalStyle.colors.text : finalStyle.colors.textDisabled,
    };

    // common container
    const containerStyle = {
        borderRadius: finalStyle.radius ?? 0,
        borderColor: finalStyle.border?.color,
        borderWidth: finalStyle.border?.width ?? 0,
        minHeight: 50,
        paddingVertical: spacerM,
        paddingHorizontal: spacerXL,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
    };

    // opacity for animated gradient
    const pressedOpacity = pressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const renderBackground = () => {
        if (isGradient(bg)) {
            return (
                <>
                    {/* default gradient */}
                    <LinearGradient
                        {...getGradientProps(bg)}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Gradient pressed, overlapped and animated */}
                    {isGradient(bgPressed) && (
                        <Animated.View
                            style={[StyleSheet.absoluteFill, { opacity: pressedOpacity }]}
                        >
                            <LinearGradient
                                {...getGradientProps(bgPressed)}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    )}
                </>
            );
        }

        // Fallback single color
        const backgroundColor = pressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
                bg,
                isGradient(bgPressed) ? bg : bgPressed,
            ],
        });
        return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]} />;
    };

    const getButtonContent = () => {
        if (isLoading) {
            return <ActivityIndicator color={finalStyle.colors.loader} />;
        }
        return (
            <>
                {icon && (
                    <Icon
                        testID={'buttonIcon'}
                        name={icon}
                        size={spacerL}
                        color={finalStyle.colors.iconTint}
                        style={{ position: text ? 'absolute' : 'relative', right: text ? 10 : 0 }}
                    />
                )}
                {text && (
                    <Text
                        testID={'buttonText'}
                        style={[finalStyle.textStyle, {
                            ...txtColors,
                            flexWrap: 'wrap'
                        }]}
                    >
                        {text}
                    </Text>
                )}
            </>
        );
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() =>
                Animated.timing(pressAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: false,
                }).start()
            }
            onPressOut={() =>
                Animated.timing(pressAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start()
            }
            style={{
                alignItems: 'stretch',
                justifyContent: 'center',
                alignSelf: 'stretch',
                overflow: 'hidden',
            }}
            disabled={disabled || isLoading}
            testID={testID}
        >
            <Animated.View
                testID={'buttonStyle'}
                style={[containerStyle, { overflow: 'hidden' }]}
            >
                {renderBackground()}
                {getButtonContent()}
            </Animated.View>
        </Pressable>
    );
};

export default Button;