import { TouchableOpacity, useColorScheme, View } from "react-native";
import Text from "../../../../Common/CustomText";
import { formatNumberWithLeadingZero, getBlackColour} from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { ChargeIndex } from "../../../../../lib/clients/apiHandlers/renaultChargesHandler";
import { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import RenaultCharge from "../../../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import AppPreferences from "../../../../../lib/appPreferences/model/appPreferences";
import { Theme, useTheme } from '@react-navigation/native';

type ChargeMonthHeaderProps = {
    readonly chargeIndex: ChargeIndex;
    readonly shouldDisplayCharges: boolean;
    readonly setShouldDisplayCharges: (shouldDisplay: boolean) => void;
}
const getBarColour = (appPreferences: AppPreferences, thereisCharge: RenaultCharge | undefined, hasDCCharge: RenaultCharge | undefined, theme:Theme): string => {
    if (appPreferences.highlightDCCharges && hasDCCharge) {
        return 'rgba(0,142,255,1)';
    }
    return thereisCharge ? theme.colors.powerGreen : 'lightgray';
};

function ChargeMonthHeader({ chargeIndex, shouldDisplayCharges, setShouldDisplayCharges }: ChargeMonthHeaderProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme()

    const { languageHandler, appPreferences } = useContext(MainContext);

    const displayMonthYear = (monthYear: string) => {
        const months = ["Janvier", "Février", "Mars",
            "Avril", "Mai", "Juin", "Juillet", "Août",
            'Septembre', "Octobre", "Novembre", "Décembre"];
        const month: any = monthYear.split("-")[0];
        const year = monthYear.split("-")[1];
        return languageHandler.getTranslation(months[month]) + " " + year;
    };

    const daysInMonthh = (anyDateInMonth: Date): number => {
        return new Date(anyDateInMonth.getFullYear(),
            anyDateInMonth.getMonth() + 1,
            0).getDate();
    }

    const drawMonthChart = () => {
        // first, get how many days in the month
        const daysInMonth = daysInMonthh(new Date(chargeIndex.year, chargeIndex.monthNumber, 1));

        const elements = [];
        for (let i = 0; i < daysInMonth; i++) {
            const thereIsCharge = chargeIndex.charges.find(charge => charge.getStartDate().getDate() === i + 1);
            const hasDCCharge = chargeIndex.charges.find(charge => charge.getStartDate().getDate() === i + 1 && charge.getAverageChargeSpeed() > 26);
            const currentDate = new Date();
            currentDate.setDate(i + 1);
            currentDate.setMonth(chargeIndex.monthNumber);
            currentDate.setFullYear(chargeIndex.year);
            const dayIsFuture = currentDate.getTime() > new Date().getTime();
            elements.push(
                <View
                    key={i}
                >
                    <View style={{
                        height: '100%',
                        width: 4,
                        borderRadius: 10,
                        backgroundColor: getBarColour(appPreferences, thereIsCharge, hasDCCharge, theme),
                        opacity: dayIsFuture ? 0.3 : 1
                    }}></View>
                    {i == 0 && <Text style={{ fontSize: 10, color: 'gray' }}>{1}</Text>}
                    {i == daysInMonth - 1 && <Text style={{ fontSize: 10, color: 'gray' }}>{daysInMonth}</Text>}
                </View>
            )
        }
        return elements;
    }
    return (
        <View style={{
            flexDirection: 'column',
            padding: 20,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                flex: 1,

            }}>
                <Text style={{
                    fontSize: 25,
                    color: getBlackColour(isDarkMode),
                    flexShrink: 1,
                    flexWrap: 'wrap',
                    flex: 1,
                }}
                    testID="chargeIndexTitle"
                >
                    {displayMonthYear(chargeIndex.monthYear)}
                </Text>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                    flex: 1,
                    flexWrap: 'wrap',
                    transform: [{ translateY: 2 }],

                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',

                    }}>
                        <Icon
                            size={15}
                            name="bolt"
                            color={getBlackColour(isDarkMode)} />
                        <Text style={{
                            color: getBlackColour(isDarkMode),
                            fontSize: 15
                        }}
                            testID="chargeIndexEnergyRecovered"
                        >{chargeIndex.totalEnergyRecovered}
                            <Text style={{ color: 'gray' }}> kWh</Text>
                        </Text>

                    </View>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',

                    }}>
                        <Icon
                            size={15}
                            name="hourglass-empty"
                            color={getBlackColour(isDarkMode)} />
                        <Text style={{
                            color: getBlackColour(isDarkMode),
                            fontSize: 15
                        }}
                            testID="chargeIndexTimeCharged"
                        >
                            {formatNumberWithLeadingZero(chargeIndex.totalTimeCharged[0])}
                            <Text style={{ color: 'gray' }}>h</Text>
                            {formatNumberWithLeadingZero(chargeIndex.totalTimeCharged[1])}
                        </Text>

                    </View>
                    <View>
                        <TouchableOpacity
                            onPress={() => setShouldDisplayCharges(!shouldDisplayCharges)}
                            style={{
                                transform: [{ rotate: shouldDisplayCharges ? '0deg' : '180deg' }],
                            }}
                            testID="chargeIndexArrow"
                        >
                            <Icon name="arrow-drop-up" size={30} color={getBlackColour(isDarkMode)} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={{
                backgroundColor: theme.colors.secondaryContainer,
                padding: 15,
                marginTop: 10,
                borderRadius: 7,
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10,
            }}>
                <View style={{ flex: 1, flexWrap: "wrap" }}>
                    <Text style={{ fontWeight: fontWeightBold, fontFamily: fontFamilyBold, fontSize: 20, flex: 1 }}>{chargeIndex.charges.length}</Text>
                    <View style={{ flexDirection: 'row', gap: 0, flex: 1, flexWrap: "wrap" }}>
                        <Text numberOfLines={1} adjustsFontSizeToFit>{languageHandler.getTranslation("charges")}</Text>
                        <Icon name="bolt" size={20} color={theme.colors.powerGreen} />
                    </View>
                </View>
                <View
                    style={{ flexDirection: 'row', gap: 5 }}>
                    {drawMonthChart()}
                </View>
            </View>
        </View>
    )
}

export default ChargeMonthHeader;