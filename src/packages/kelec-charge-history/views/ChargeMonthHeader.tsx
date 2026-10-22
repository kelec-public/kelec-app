import { StyleSheet, useColorScheme, View } from "react-native";
import { useContext, useMemo } from "react";
import { Theme, useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import { formatNumberWithLeadingZero, getBlackColour } from "../../../lib/graphics/utils";
import { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import MainContext from "../../../lib/Contexts/MainContext";
import { ChargeMonth, ChargeMonthDay } from "../models/ChargeMonth";
import { getMonthDays } from "../services/chargeMonths";
import { sumCosts } from "../services/chargeCost";
import ChargeCostsContext from "../controllers/ChargeCostsContext";
import GlassButton from "../../kelec-model/view/GlassButton";

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

    const costs = useContext(ChargeCostsContext);
    const days = useMemo(() => getMonthDays(month), [month]);
    const totalCost = useMemo(
        () => costs && sumCosts(month.charges.map(costs.costOf)),
        [costs, month],
    );
    const textColour = getBlackColour(isDarkMode);

    const statColour = theme.colors.onSecondaryContainer;
    const statCardStyle = [styles.card, styles.stat, { backgroundColor: theme.colors.secondaryContainer }];

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: textColour }]} testID="chargeIndexTitle">
                    {languageHandler.getTranslation(MONTH_KEYS[month.monthNumber]) + " " + month.year}
                </Text>
                {/* nombre de charges du mois ; replie ou déplie le mois */}
                <GlassButton
                    testID="chargeIndexArrow"
                    icon="bolt"
                    iconPosition="start"
                    iconSize={20}
                    text={String(month.charges.length)}
                    textStyle={styles.count}
                    trailingIcon={expanded ? "expand-less" : "expand-more"}
                    onPress={onToggle}
                    glassStyle={styles.countButton}
                    fallbackStyle={[styles.countButton, { backgroundColor: theme.colors.secondaryContainer }]}
                    fallbackIconColour={theme.colors.onSecondaryContainer}
                    fallbackTextColour={theme.colors.onSecondaryContainer}
                />
            </View>
            <View style={styles.stats}>
                <View style={statCardStyle}>
                    <Icon size={18} name="bolt" color={statColour} />
                    <Text style={{ color: statColour, fontSize: 15 }}
                        testID="chargeIndexEnergyRecovered"
                    >{month.totalEnergyRecovered}
                        <Text style={{ color: 'gray' }}> kWh</Text>
                    </Text>
                </View>
                <View style={statCardStyle}>
                    <Icon size={18} name="hourglass-empty" color={statColour} />
                    <Text style={{ color: statColour, fontSize: 15 }}
                        testID="chargeIndexTimeCharged"
                    >
                        {formatNumberWithLeadingZero(month.totalTimeCharged[0])}
                        <Text style={{ color: 'gray' }}>h</Text>
                        {formatNumberWithLeadingZero(month.totalTimeCharged[1])}
                    </Text>
                </View>
                {costs && totalCost !== null && (
                    <View style={statCardStyle}>
                        <Icon size={18} name="payments" color={statColour} />
                        <Text style={{ color: statColour, fontSize: 15 }} testID="chargeIndexCost">{' '}{costs.format(totalCost)}</Text>
                    </View>
                )}
            </View>
            {/* une barre par jour, sur toute la largeur */}
            <View style={[styles.card, { backgroundColor: theme.colors.secondaryContainer }]}>
                <View style={styles.days}>
                    {days.map(day => (
                        <View key={day.day} style={styles.day}>
                            <View style={[styles.dayBar, {
                                backgroundColor: getBarColour(day, appPreferences.highlightDCCharges, theme),
                                opacity: day.isFuture ? 0.3 : 1
                            }]}></View>
                        </View>
                    ))}
                </View>
                <View style={styles.dayNumbers}>
                    <Text style={styles.dayNumber}>1</Text>
                    <Text style={styles.dayNumber}>{days.length}</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: 20,
        gap: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 25,
        flexShrink: 1,
        flexWrap: 'wrap',
        flex: 1,
    },
    count: {
        fontSize: 18,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
    },
    countButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 2,
    },
    card: {
        padding: 15,
        borderRadius: 7,
    },
    stats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    stat: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
    },
    days: {
        flexDirection: 'row',
        gap: 3,
        height: 30,
    },
    day: {
        flex: 1,
    },
    dayBar: {
        height: '100%',
        borderRadius: 10,
    },
    dayNumbers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 3,
    },
    dayNumber: {
        fontSize: 10,
        color: 'gray',
    },
});

export default ChargeMonthHeader;
