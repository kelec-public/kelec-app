import React, { PropsWithoutRef } from "react";
import { Text as RNText, StyleSheet } from "react-native";
import { useTheme } from '@react-navigation/native';


type TextProps = PropsWithoutRef<{
    readonly style?: any;
    readonly children?: React.ReactNode;
    readonly testID?: string;
    readonly numberOfLines?: number;
    readonly adjustsFontSizeToFit?: boolean;
}>;

function Text({ style, ...otherProps }: TextProps): React.JSX.Element {
    const theme = useTheme()
    const mergedStyles = [{ color: theme.colors.text }, styles.defaultFont, style,];
    return <RNText testID={otherProps.testID} style={mergedStyles} {...otherProps} />;
};

const styles = StyleSheet.create({
    defaultFont: {
        fontFamily: 'NouvelR'
    }
});

export default Text;