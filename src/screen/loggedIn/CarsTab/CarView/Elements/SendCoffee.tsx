import { View, TouchableOpacity, useColorScheme, Linking } from "react-native";
import Text from "../../../../Common/CustomText";
import { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import { getBlackColour, getWhiteColour } from "../../../../../lib/graphics/utils";
import { SafeAreaView } from "react-native-safe-area-context";

type SendCoffeeCardProps = {
    readonly navigation: any;
}

function SendCoffeeCard({ navigation }: SendCoffeeCardProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

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
                <TouchableOpacity
                    testID="openDonation"
                    onPress={() => {

                        Linking.openURL('https://www.paypal.com/donate/?hosted_button_id=8ZZMKEA6NTCDC');
                    }
                    }>
                    <View
                        style={{
                            backgroundColor: 'rgb(238,192,84)',
                            borderRadius: 10,
                            marginHorizontal: 10,
                            height: 50,
                            justifyContent: 'center',

                        }}>
                        <Text style={[{
                            fontSize: 16,
                            color: 'black',
                            textAlign: 'center',
                            fontFamily: fontFamilyBold,
                            fontWeight: fontWeightBold
                        }]}>
                            {languageHandler.getTranslation('makeADonation')}
                        </Text>

                    </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}></View>
                <TouchableOpacity
                    testID="closeSendCoffeeView"
                    onPress={() => {
                        navigation.goBack();
                    }
                    }>
                    <View
                        style={{
                            backgroundColor: getBlackColour(isDarkMode),
                            borderRadius: 10,
                            marginHorizontal: 10,
                            height: 50,
                            justifyContent: 'center',

                        }}>
                        <Text style={[{
                            fontSize: 16,
                            color: getWhiteColour(isDarkMode),
                            textAlign: 'center',
                            fontFamily: fontFamilyBold,
                            fontWeight: fontWeightBold
                        }]}>
                            {languageHandler.getTranslation('back')}
                        </Text>

                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        </View>)
}

export default SendCoffeeCard;