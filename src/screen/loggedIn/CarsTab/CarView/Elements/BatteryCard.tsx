import { ColorValue, DimensionValue, StyleSheet, View, useColorScheme } from "react-native";
import Text from "../../../../Common/CustomText";
import { formatNumberWithLeadingZero, getBlackColour, getChargingBarColour, getGrayBackgroundColour } from "../../../../../lib/graphics/utils";
import { useContext } from "react";
import CarViewContext from "../../../../../lib/Contexts/CarViewContext";
import MainContext from "../../../../../lib/Contexts/MainContext";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChargeSchedule, ChargeSettingsStatus } from "../../../../../lib/clients/carMakers/renaultClient";
import InfoPopup from "../../../../Common/InfoPopup";


function BatteryCard(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { apiHandler, carType } = useContext(CarViewContext);

    const { appPreferences, languageHandler } = useContext(MainContext);

    const getBatteryBarLength = (): DimensionValue => {
        return apiHandler.getBatteryLevel() + '%' as DimensionValue;
    }

    const getFullRange = (currentRange: number, currentSOC: number): number => {
        return parseInt((currentRange / (currentSOC / 100)).toFixed(0));
    }

    const formatHour = (hour: number) => {
        const hours = Math.floor(hour / 60);
        let minutes = hour % 60;
        const strTime = hours + 'h' + formatNumberWithLeadingZero(minutes);
        return strTime;
    };

    const formatDate = (dateF: Date) => {
        let hours = dateF.getHours();
        let minutes = dateF.getMinutes();
        const strTime = formatNumberWithLeadingZero(hours) + ':' + formatNumberWithLeadingZero(minutes);
        return strTime;
    };

    const getChargingLimitBarLength = (): DimensionValue => {
        return apiHandler.getChargingLimit(carType) + '%' as DimensionValue;
    }

    // only for renault cars
    const getNextChargeText = (chargeSettings: ChargeSettingsStatus | null) => {
        if (chargeSettings == null) {
            return "ERROR1";
        }
        const closestDateTime = getClosestDate(chargeSettings);
        if (closestDateTime == null) {
            return "ERROR2";
        }
        const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const strDay = weekdays[closestDateTime.getDay()];
        const strTime = closestDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return languageHandler.getTranslation(strDay) + languageHandler.getTranslation("at") + strTime;

    };
    const getClosestDate = (chargeSettings: ChargeSettingsStatus): Date | null => {
        const referenceDate = new Date(chargeSettings.dateTime);
        const mode = chargeSettings.mode;
        if (mode == "delayed") {
            return new Date(chargeSettings.startDateTime);
        }
        // else, mode schedulded
        const schedules = chargeSettings.schedules;
        let closestDateTime = null;
        for (const schedule of schedules) {
            const closestSchedule = getClosestOfSchedule(referenceDate, schedule);
            //check if closestSchedule is non (desactivated schedule)
            if (closestSchedule == null) {
                continue;
            }
            if (closestDateTime == null || closestSchedule < closestDateTime) {
                closestDateTime = closestSchedule;
            }
        }
        return closestDateTime;
    };

    const getClosestOfSchedule = (referenceDate: Date, schedule: ChargeSchedule): Date | null => {
        // among one schedule, this function return the closest date of the schedule
        // referenceDate is the date where data was last refreshed

        if (!schedule.activated) {
            // schedule is desactivated, ignore.
            return null;
        }

        // if schedule is active, we need to find the closest date of the schedule
        let closestDateTime = null; // the return
        for (const day in daysOfWeek) {
            // iterate over each day of the week to find the closest date
            const daySchedule = (schedule as any)[daysOfWeek[day]];
            if (daySchedule == null) {
                // unable to get day, ignore.
                continue;
            }

            // if day is valid 
            const dayOffset = daysOffset(daysOfWeek[day], referenceDate);
            const startTime = daySchedule.startTime;
            const startDateTime = new Date(referenceDate.toISOString().split('T')[0] + startTime);
            if (dayOffset == 0) {
                // same day, verify if the time is in the future
                if (startDateTime < referenceDate) {
                    startDateTime.setDate(startDateTime.getDate() + 7);
                }
            }
            startDateTime.setDate(startDateTime.getDate() + dayOffset);
            startDateTime.setHours(startDateTime.getHours() - 2);  //because renault api is 2 hour early
            // handle changed with app prefereces
            const offset = appPreferences.scheduledChargeOffset;
            startDateTime.setHours(startDateTime.getHours() + offset);
            // now starteDateTime is the Date format of the charge start
            if (closestDateTime == null || startDateTime < closestDateTime) {
                closestDateTime = startDateTime;
            }
        }

        return closestDateTime;

    }
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const daysOffset = (day: string, referenceDate: Date): number => {
        //this method returns how many days are between the reference date and the next day of the week
        const days = daysOfWeek.indexOf(day) - referenceDate.getDay();
        if (days < 0) {
            return days + 7;
        }
        return days;
    }

    const getChargingBarBackgroundColour = (): ColorValue => {
        if (apiHandler.getIsCarPlugged()) {
            return getChargingBarColour(apiHandler.getIsV2GOrV2L());
        }

        return 'rgb(0,122,255)';
    }



    return (
        <View style={[styles.summaryCard, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]} testID="batteryCard">
            <View style={styles.batteryLevelTextWrapper}>
                <View style={commonStyles.rowFlex}>
                    <Text testID={'batteryPercentage'} style={styles.elementText}>{apiHandler.getBatteryLevel()}</Text>
                    <Text testID={'batteryPercentageSymbol'} style={styles.elementSmallText}>%</Text>
                </View>
            </View>
            <View style={{ marginBottom: 20, position: 'relative' }}>
                <View style={styles.grayBatteryBar} />
                <View style={styles.colourBatteryBarsWrapper}>
                    {carType.shouldDisplayChargingLimit() && apiHandler.getIsCarPlugged() && (
                        <View testID="chargingLimitBar" style={{ backgroundColor: getChargingBarColour(apiHandler.getIsV2GOrV2L(), 0.3), width: getChargingLimitBarLength(), height: 20, borderTopLeftRadius: 100, borderBottomLeftRadius: 100, borderRadius: 100, position: 'absolute' }}></View>
                    )}
                    <View testID={'chargingBar'} style={[{ backgroundColor: getChargingBarBackgroundColour(), width: getBatteryBarLength() }, styles.colourBatteryBar]}></View>

                    <View style={{ flexDirection: 'column', position: 'relative', zIndex: 3, right: 0, transform: [{ translateY: 22 }] }}>
                        <Text style={{ left: '-50%', marginTop: 5 }}><Text testID={'batteryRange'} style={{ fontWeight: 'bold' }}>{apiHandler.getCarRange(appPreferences)}</Text> {appPreferences.distanceUnits}</Text>
                    </View>

                </View>
                <View style={{ position: 'absolute', right: 0, zIndex: 3 }}>
                    <View style={{ flexDirection: 'column', position: 'relative', zIndex: 3, transform: [{ translateY: -22 }], alignItems: 'flex-end' }}>
                        <Text testID={'fullRange+Units'} style={{ marginBottom: 5 }}><Text testID={'fullRange'} style={{ fontWeight: 'bold' }}>{getFullRange(apiHandler.getCarRange(appPreferences), apiHandler.getBatteryLevel())}</Text> {appPreferences.distanceUnits}</Text>

                    </View>
                </View>

            </View>
            <View testID={'chargeTimeWrapper'} style={{ gap: 10 }}>
                {apiHandler.getIsCarPlugged() && (
                    <View style={{ gap: 10 }}>
                        <View testID="chargeTimeIfCharging" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: "wrap" }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text testID={'chargeText'} style={{ fontSize: 15, }}>{languageHandler.getTranslation(apiHandler.getChargeText())}</Text>
                                {(apiHandler.getIsCarCharging() && apiHandler.getBatteryLevel() < 100 && appPreferences.displayChargingPower) && (
                                    <View testID={'chargingWrapper'} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                                        <Icon name="bolt" size={20} color={getChargingBarColour(apiHandler.getIsV2GOrV2L())} />
                                        <Text testID={'chargingPowerText'} style={{ fontWeight: 'bold', fontSize: 15 }}>{apiHandler.getChargingPower(carType)}</Text>
                                        <Text testID={'chargingPowerUnit'} style={{ fontSize: 15, color: 'gray', fontWeight: '300' }}> {'kW'}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="hourglass-top" size={15} color={getBlackColour(isDarkMode)} />
                                <Text testID={'remainingTimeText'} style={{ fontSize: 15 }}>{apiHandler.getIsCarCharging() && apiHandler.getBatteryLevel() != 100 ? formatHour(apiHandler.getRemainingMinutes()) : '--h--'}</Text>
                                <View testID={'endHourWrapper'} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: apiHandler.getIsCarCharging() && apiHandler.getBatteryLevel() < 100 ? 1 : 0 }}>
                                    <Icon name="battery-charging-full" size={15} style={{ marginLeft: 10 }} color={getBlackColour(isDarkMode)} />
                                    <Text testID={'endHourText'} style={{ fontSize: 15 }}>{formatDate(apiHandler.getEndChargeHour())}</Text>
                                </View>

                            </View>
                        </View>
                        {carType.shouldDisplayChargingLimit() && apiHandler.getChargingPower(carType) < 0 && (
                            <InfoPopup
                                testID={'negativeChargingPowerPopup'}
                                backgroundColour={'#FFCCB3'}
                                icon={'warning'}
                                iconColour={'#7A1F1F'}
                            >
                                <Text style={{ color: '#7A1F1F' }}>{languageHandler.getTranslation("negativeChargingPower")}</Text>
                            </InfoPopup>
                        )}
                    </View>
                )}
                {apiHandler.shouldDisplayNextChargeSettings() && (
                    <View testID="shouldDisplayNextCharge" style={{ flexDirection: 'row', gap: 5, marginTop: 10 }}>
                        <Icon testID={'nextChargeIcon'} name="electrical-services" size={15} color={getBlackColour(isDarkMode)} />
                        <Text>{languageHandler.getTranslation("nextCharge")}<Text testID={'nextChargeDate'}>{getNextChargeText(apiHandler.getChargingSettings())}</Text></Text>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    summaryCard: {
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 7,
    },
    batteryLevelTextWrapper: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'center'
    },
    elementText: {
        fontFamily: fontFamilyBold,
        fontWeight: fontWeightBold,
        fontSize: 25
    },
    elementSmallText: {
        color: 'gray',
        fontSize: 25,
        fontWeight: '300'
    },
    grayBatteryBar: {
        backgroundColor: 'lightgray',
        width: '100%',
        height: 20,
        borderTopLeftRadius: 100,
        borderBottomLeftRadius: 100,
        borderRadius: 100,
        zIndex: 1
    },
    colourBatteryBarsWrapper: {
        position: 'absolute',
        zIndex: 2,
        width: '100%',
        flexDirection: 'row'
    },
    colourBatteryBar: {
        height: 20,
        borderTopLeftRadius: 100,
        borderBottomLeftRadius: 100,
        borderRadius: 100,
    }
});

export default BatteryCard;