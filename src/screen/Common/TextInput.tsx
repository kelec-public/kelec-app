import { TextInput as RNTextInput, useColorScheme, StyleSheet } from "react-native";
import { getBlackColour } from "../../lib/graphics/utils";

type TextInputProps = {
    readonly style?: any;
    readonly placeholder?: string;
    readonly value?: string;
    readonly onChangeText?: (text: string) => void;
    readonly secureTextEntry?: boolean;
    readonly testID?: string;
    readonly keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
};

function TextInput({ style, ...otherProps }: TextInputProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    return <RNTextInput style={[styles.textInput, { color: getBlackColour(isDarkMode) }, style]} {...otherProps} />;
};

const styles = StyleSheet.create({
    textInput: {
        height: 40,
        borderColor: 'lightgray',
        borderWidth: 1,
        margin: 10,
        padding: 10,
        borderRadius: 5,
    }
});

export default TextInput;