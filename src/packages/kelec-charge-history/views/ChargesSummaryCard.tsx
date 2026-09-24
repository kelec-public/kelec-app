import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { getBlackColour, getGrayBackgroundColour } from "../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import CarViewContext from "../../../lib/Contexts/CarViewContext";
import { ChargesHistoryParams } from "../types/navigation";

type Props = {
    readonly navigation: { navigate: (route: 'ChargesView', params: ChargesHistoryParams) => void };
}

/** Carte de la page voiture : totaux de l'historique, ouvre l'écran d'historique. */
function ChargesSummaryCard({ navigation }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);
    const { apiHandler, carType } = useContext(CarViewContext);

    const history = apiHandler.getChargesHistory();
    const [hours, minutes] = history.getTotalTimeCharging();

    return (
        <TouchableOpacity onPress={() => {
            navigation.navigate('ChargesView', { charges: history, carType: carType });
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
                            <View style={styles.total}>
                                <Icon name="bolt" size={20} color={getBlackColour(isDarkMode)} />
                                <Text style={{ fontSize: 20, color: getBlackColour(isDarkMode) }} testID="ChargesCardEnergyRecovered">{history.getTotalEnergyRecovered()} <Text style={{ color: 'gray' }}>kWh</Text></Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'gray' }}></View>
                            <View style={styles.total}>
                                <Icon size={20} name="hourglass-empty" color={getBlackColour(isDarkMode)} />
                                <Text style={{ fontSize: 20, color: getBlackColour(isDarkMode) }} testID="ChargesCardTotalTime">{hours}<Text style={{ color: 'gray' }}>h</Text>{minutes}</Text>
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
    total: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
});

export default ChargesSummaryCard;
