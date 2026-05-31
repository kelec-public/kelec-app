import React from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../CustomText";
import { getBlackColour } from "../../../lib/graphics/utils";

type Props = {
    navigation: any
    rightIcon?: React.JSX.Element
    title: string
    children?: React.JSX.Element | React.JSX.Element[]
}

function TopNavHeader({ navigation, rightIcon, children, title }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <View>
            <View style={
                [commonStyles.rowFlex, commonStyles.spaceBetween, commonStyles.paddingHorizontal]
            }>
                <TouchableOpacity
                    testID="backButton"
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Icon name="chevron-left" size={30} color={getBlackColour(isDarkMode)} />
                </TouchableOpacity>
                <Text style={[styles.titleText, { color: getBlackColour(isDarkMode), flexShrink: 1, flexWrap: 'wrap' }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
                {rightIcon}
            </View>
            {children}
            <View style={commonStyles.navSeparator}></View>
        </View>
    )
}

const styles = StyleSheet.create({
    titleText: {
        textAlign: 'center',
        paddingHorizontal: 10,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
        fontSize: 25,
    },
});

export default TopNavHeader;