import React, { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Text from "../../../../../Common/CustomText";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../../../CarsPageView";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../../lib/graphics/commonStyle";
import { getBlackColour, getWhiteColour } from "../../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from "../../../../../../lib/Contexts/MainContext";

type ImportViewProps = NativeStackScreenProps<CarsViewParamList, 'ImportChargesView'>;

function ImportChargesView({ navigation, route }: ImportViewProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);

    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode) }]}
            testID="ImportChargesView"
        >
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
                <Text style={[styles.titleText, { color: getBlackColour(isDarkMode), flexShrink: 1, flexWrap: 'wrap' }]} numberOfLines={1} adjustsFontSizeToFit>{languageHandler.getTranslation("importCharges")}</Text>
                <View style={{ width: 30 }}></View>
            </View>

        </SafeAreaView>
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
})

export default ImportChargesView;