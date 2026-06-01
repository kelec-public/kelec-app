import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Text from "../../../../Common/CustomText";
import { formatNumberWithLeadingZero, getBlackColour, getGrayBackgroundColour } from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import CarViewContext from "../../../../../lib/Contexts/CarViewContext";

type MainChargesCardProps = {
    readonly navigation: any;
}

function MainChargesCard({ navigation }: MainChargesCardProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);
    const { apiHandler, carType } = useContext(CarViewContext);


    return (
        <TouchableOpacity onPress={() => {
            navigation.navigate('ChargesView', {
                charges: apiHandler.getChargesHistory(),
                carType: carType
            });
        }}>
            <View style={[styles.ChargesCard, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]} testID="ChargesCard">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="ev-station" size={20} color={getBlackColour(isDarkMode)} />
                        <View>
                            <Text style={{ fontSize: 18, marginLeft: 10, color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation("charges")}
                                <Text style={{ color: 'gray', fontSize: 13 }}> / {languageHandler.getTranslation("total")}</Text>
                            </Text>

                        </View>
                    </View>
                    <Icon name="arrow-forward-ios" size={20} color={getBlackColour(isDarkMode)} />
                </View>
                <View style={{ paddingTop: 10, backgroundColor: getGrayBackgroundColour(isDarkMode), borderBottomLeftRadius: 7, borderBottomRightRadius: 7 }}>
                    <View style={{ gap: 10 }}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <Icon name="bolt" size={20} color={getBlackColour(isDarkMode)} />

                                <Text style={{ fontSize: 20, color: getBlackColour(isDarkMode) }} testID="ChargesCardEnergyRecovered">{apiHandler.getChargesHistory().getTotalEnergyRecovered()} <Text style={{ color: 'gray' }}>kWh</Text></Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'gray' }}></View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                <Icon size={20} name="hourglass-empty" color={getBlackColour(isDarkMode)} />
                                <Text style={{ fontSize: 20, color: getBlackColour(isDarkMode) }} testID="ChargesCardTotalTime">{apiHandler.getChargesHistory().getTotalTimeCharging().hours}<Text style={{ color: 'gray' }}>h</Text>{formatNumberWithLeadingZero(apiHandler.getChargesHistory().getTotalTimeCharging().minutes)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    ChargesCard: {
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 7,
    },
});

export default MainChargesCard;