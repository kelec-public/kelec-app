import React from "react";
import { NEUTRAL_200, NEUTRAL_ZERO } from "../lib/colours";
import Text from "../../../screen/Common/CustomText";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { subTitle2 } from "./Titles";
import { spacerL, spacerM, spacerS, spacerXL } from "./Spacers";

type ButtonProps = {
    colour: string;
    text: string;
    onPress: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    testID?: string;
    iconName?: string;
}

const Button = (props: ButtonProps): React.JSX.Element => {
    const { colour, text, onPress, disabled, isLoading, testID, iconName } = props;

    const getButtonContent = () => {
        if (isLoading) {
            return <ActivityIndicator />;
        }
        if (iconName) {
            return <Icon name={iconName} size={spacerL} color={colour === NEUTRAL_ZERO ? 'black' : 'white'} />;
        } else {
            return <Text style={subTitle2}>{text}</Text>;
        }
    };

    return (

        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: disabled ? NEUTRAL_200 : colour,
                borderRadius: spacerS,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacerM,
                paddingHorizontal: spacerXL,
                borderWidth: colour === NEUTRAL_ZERO ? 1 : 0,
                borderColor: '#CCCCCC',
                alignSelf: 'stretch',
                flexGrow: 1
            }}
            disabled={disabled || isLoading}
            testID={testID}
        >
            {getButtonContent()}

        </TouchableOpacity>
    )
};

export default Button;