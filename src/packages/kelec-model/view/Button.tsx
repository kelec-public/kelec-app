import React from "react";
import Text from "../../../screen/Common/CustomText";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { subTitle } from "./Titles";
import { spacerL, spacerM, spacerXL } from "./Spacers";
import { ButtonColours, ButtonColoursPalettes } from "../lib/buttonTypes";

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
            return <Text style={[subTitle, { color: getCurrentColour.textColour }]}>{text}</Text>;
        }
    };

    return (

        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: getCurrentColour.backgroundColour,
                borderRadius: spacerM,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacerM,
                paddingHorizontal: spacerXL,
                borderWidth: getCurrentColour.borderWidth,
                borderColor: '#CCCCCC',
                alignSelf: 'stretch',
                flexGrow: 1,
            }}
            disabled={disabled || isLoading}
            testID={testID}
        >
            {getButtonContent()}

        </TouchableOpacity>
    )
};

export default Button;