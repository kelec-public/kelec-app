import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { useContext, useMemo } from "react";
import { Theme, useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import { formatNumberWithLeadingZero, getBlackColour } from "../../../lib/graphics/utils";
import { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import MainContext from "../../../lib/Contexts/MainContext";
import { ChargeMonth, ChargeMonthDay } from "../models/ChargeMonth";
import { getMonthDays } from "../services/chargeMonths";

/** Clés de traduction des mois, indexées par numéro de mois (0-11). */
const MONTH_KEYS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août",
    "Septembre", "Octobre", "Novembre", "Décembre"];

const getBarColour = (day: ChargeMonthDay, highlightDC: boolean, theme: Theme): string => {
    if (highlightDC && day.hasDCCharge) {
        return 'rgba(0,142,255,1)';
    }
    return day.hasCharge ? theme.colors.powerGreen : 'lightgray';
};

type Props = {
    readonly month: ChargeMonth;
    readonly expanded: boolean;
    readonly onToggle: () => void;
}

function ChargeMonthHeader({ month, expanded, onToggle }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler, appPreferences } = useContext(MainContext);

    const days = useMemo(() => getMonthDays(month), [month]);
    const textColour = getBlackColour(isDarkMode);

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: textColour }]} testID="chargeIndexTitle">
                    {languageHandler.getTranslation(MONTH_KEYS[month.monthNumber]) + " " + month.year}
                </Text>
                <View style={styles.totals}>
                    <View style={styles.total}>
                        <Icon size={15} name="bolt" color={textColour} />
                        <Text style={{ color: textColour, fontSize: 15 }}
                            testID="chargeIndexEnergyRecovered"
                        >{month.totalEnergyRecovered}
                            <Text style={{ color: 'gray' }}> kWh</Text>
                        </Text>
                    </View>
                    <View style={styles.total}>
                        <Icon size={15} name="hourglass-empty" color={textColour} />
                        <Text style={{ color: textColour, fontSize: 15 }}
                            testID="chargeIndexTimeCharged"
                        >
                            {formatNumberWithLeadingZero(month.totalTimeCharged[0])}
                            <Text style={{ color: 'gray' }}>h</Text>
                            {formatNumberWithLeadingZero(month.totalTimeCharged[1])}
                        </Text>
                    </View>
                    <View>
                        <TouchableOpacity
                            onPress={onToggle}
                            style={{ transform: [{ rotate: expanded ? '0deg' : '180deg' }] }}
                            testID="chargeIndexArrow"
                        >
                            <Icon name="arrow-drop-up" size={30} color={textColour} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={[styles.chartCard, { backgroundColor: theme.colors.secondaryContainer }]}>
                <View style={{ flex: 1, flexWrap: "wrap", flexDirection: 'row' }}>
                    <Text style={{ fontWeight: fontWeightBold, fontFamily: fontFamilyBold, fontSize: 20 }}>{month.charges.length}</Text>
                    <Icon name="bolt" size={20} color={theme.colors.powerGreen} />
                </View>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                    {days.map(day => (
                        <View key={day.day}>
                            <View style={[styles.dayBar, {
                                backgroundColor: getBarColour(day, appPreferences.highlightDCCharges, theme),
                                opacity: day.isFuture ? 0.3 : 1
                            }]}></View>
                            {(day.day === 1 || day.day === days.length) && <Text style={{ fontSize: 10, color: 'gray' }}>{day.day}</Text>}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    title: {
        fontSize: 25,
        flexShrink: 1,
        flexWrap: 'wrap',
        flex: 1,
    },
    totals: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        flex: 1,
        flexWrap: 'wrap',
        transform: [{ translateY: 2 }],
    },
    total: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chartCard: {
        padding: 15,
        marginTop: 10,
        borderRadius: 7,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    dayBar: {
        height: '100%',
        width: 4,
        borderRadius: 10,
    },
});

export default ChargeMonthHeader;
