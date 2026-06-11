import { View, TouchableOpacity, useColorScheme, Linking } from "react-native";
import Text from "../../../../Common/CustomText";
import React, { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import { getBlackColour, getWhiteColour } from "../../../../../lib/graphics/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from '../../../../../packages/kelec-model/view/Button';
import { ThemeContext } from '@react-navigation/native';

type SendCoffeeCardProps = {
    readonly navigation: any;
}

function SendCoffeeCard({ navigation }: SendCoffeeCardProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const useTheme = useContext(ThemeContext);

    const { languageHandler } = useContext(MainContext);
    return (
        <View
            style={{ flex: 1, backgroundColor: getWhiteColour(isDarkMode), padding: 15 }}
            testID="sendCoffeeView"
        >
            <SafeAreaView style={{ flex: 1, display: 'flex', gap: 15, }} >
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 }}>
                    <MaterialIcon style={{ transform: [{ translateY: 3 }] }} name="coffee-outline" size={30} color={getBlackColour(isDarkMode)}></MaterialIcon>
                    <Text style={{
                        fontSize: 25, fontFamily: fontFamilyBold,
                        fontWeight: fontWeightBold, color: getBlackColour(isDarkMode)
                    }}>{languageHandler.getTranslation('buyMeACoffee')}</Text>
                </View>
                <Text style={{ textAlign: 'center', fontSize: 15, color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation('donationDescription')}</Text>
                <Button
                    text={languageHandler.getTranslation('makeADonation')}
                    testID="openDonation"
                    buttonStyle={useTheme?.buttons.donate}
                    onPress={() => {
                        Linking.openURL('https://www.paypal.com/donate/?hosted_button_id=8ZZMKEA6NTCDC');
                    }
                    }/>
                <View style={{ flex: 1 }}></View>
                <Button
                    testID="closeSendCoffeeView"
                    text={languageHandler.getTranslation('back')}
                    buttonStyle={useTheme?.buttons.neutral}
                    onPress={() => {
                        navigation.goBack();
                    }
                    }/>
            </SafeAreaView>
        </View>)
}

export default SendCoffeeCard;