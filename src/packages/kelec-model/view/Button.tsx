import React from "react";
import Text from "../../../screen/Common/CustomText";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { subTitle } from "./Titles";
import { spacerL, spacerM, spacerXL } from "./Spacers";
import { ButtonColours, ButtonColoursPalettes } from "../lib/buttonTypes";
import LinearGradient from "react-native-linear-gradient";

type ButtonProps = {
    buttonColour: ButtonColours;
    text: string;
    onPress: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    testID?: string;
    iconName?: string;
}

const Button = (props: ButtonProps): React.JSX.Element => {
    const { buttonColour, text, onPress, disabled, isLoading, testID, iconName } = props;

    const colourToApply = disabled ? ButtonColours.DISABLED : buttonColour;
    const getCurrentColour = ButtonColoursPalettes[colourToApply];

    const getButtonContent = () => {
        if (isLoading) {
            return <ActivityIndicator />;
        }
        if (iconName) {
            return <Icon name={iconName} size={spacerL} color={getCurrentColour.textColour} />;
        } else {
            return <Text style={[subTitle, { color: getCurrentColour.textColour, fontWeight: '400' }]}>{text}</Text>;
        }
    };

    return (

        <TouchableOpacity
            onPress={onPress}
            style={{
                borderRadius: spacerM,
                borderWidth: getCurrentColour.borderWidth,
                borderColor: '#CCCCCC',
                alignSelf: 'stretch',
                overflow: 'hidden',

            }}
            disabled={disabled || isLoading}
            testID={testID}
        >
            <LinearGradient
                colors={getCurrentColour.backgroundColour}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={{
                    paddingVertical: spacerM,
                    paddingHorizontal: spacerXL,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',

                }}>
                    {getButtonContent()}
                </View>
            </LinearGradient>

        </TouchableOpacity>
    )
};

export default Button;