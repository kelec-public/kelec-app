import { Alert, DimensionValue, Modal, TouchableOpacity, View, useColorScheme, StyleSheet, ScrollView, Dimensions } from "react-native";
import Text from "../../../../Common/CustomText";
import RenaultCharge from "../../../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import CarType from "../../../../../lib/clients/cars/carTypes/carType";
import { useContext, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { convertDateForChargeHistory, convertHoursForChargeHistory, formatNumberWithSpaces, getBlackColour, getDistance, getGrayBackgroundColour, getWhiteColour } from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import CarsViewContext from "../../../../../lib/Contexts/CarsViewContext";
import BigButton from "../../../../Common/BigButton";
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomSheet from "../../../../Common/bottomSheet/BottomSheet";

type ChargeCardProps = {
    readonly charge: RenaultCharge;
    readonly carType: CarType;
}

function ChargeCard({ charge, carType }: ChargeCardProps): React.JSX.Element {

    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme()

    const { appPreferences, languageHandler } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);

    const getBackgroundColour = () => {
        if (appPreferences.highlightDCCharges && charge.getAverageChargeSpeed() > 25) {
            return isDarkMode ? 'rgba(0,142,255,0.5)' : 'rgba(0,142,255,0.2)';
        } else {
            return getWhiteColour(isDarkMode);
        }
    }

    const getBarWidth = (unit: number): DimensionValue => {
        return unit.toString() + '%' as DimensionValue;
    }

    const [shouldOpenSubChargesModal, setShouldOpenSubChargesModal] = useState(false);

    return (
        <View testID={'ChargeCard'} style={{ padding: 15, backgroundColor: getBackgroundColour(), marginHorizontal: 10, marginTop: 0, borderRadius: 7 }}>
            <BottomSheet
                testID="mergeViewBottomSheet"
                onClose={() => {
                    setShouldOpenSubChargesModal(false);
                    handleModalAnim(false);
                }}
                visible={shouldOpenSubChargesModal}
                title={languageHandler.getTranslation('mergeCharges')}
            >

                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    {charge.getSubCharges().map((subCharge) => (
                        <ChargeCard
                            key={subCharge.getStartDate().toISOString()}
                            charge={subCharge}
                            carType={carType}
                        />
                    ))}
                </ScrollView>
            </BottomSheet>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {charge.getIsSameDay() && (
                    <View style={{
                        flex: 1, flexDirection: 'row', flexWrap: "wrap"
                    }}>
                        <Text testID={'sameDayDate'} style={{ color: getBlackColour(isDarkMode) }
                        } > {convertDateForChargeHistory(charge.getStartDate(), false)}{' '}</Text>
                        <Text testID={'sameDayTime'} style={{ color: getBlackColour(isDarkMode) }}>{convertHoursForChargeHistory(charge.getStartDate(), charge.getEndDate())}</Text>
                    </View>
                )
                }
                {
                    !charge.getIsSameDay() && (
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: "wrap" }}>
                            <Text testID={'notSameDayDate'} style={{ color: getBlackColour(isDarkMode) }}>{convertDateForChargeHistory(charge.getStartDate(), true)} {'->'} </Text>
                            <Text testID={'notSameDayTime'} style={{ color: getBlackColour(isDarkMode) }}>{convertDateForChargeHistory(charge.getEndDate(), true)} </Text>
                        </View>
                    )
                }
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', flex: 1, flexWrap: "wrap" }}>
                    <Text testID={'chargeStartLevelText'} style={{
                        fontWeight: fontWeightBold,
                        fontFamily: fontFamilyBold,
                        fontSize: 18,
                        color: getBlackColour(isDarkMode)
                    }}>{charge.chargeStartBatteryLevel}<Text style={{ color: 'gray', fontWeight: '300' }}>%</Text></Text>
                    <Icon name="chevron-right" size={18} color={getBlackColour(isDarkMode)} />
                    <Text testID={'endPercentage'} style={{
                        fontWeight: fontWeightBold,
                        fontFamily: fontFamilyBold,
                        fontSize: 18, color: getBlackColour(isDarkMode)
                    }}>{charge.getEndPercentage()}<Text style={{ color: 'gray', fontWeight: '300' }}>%</Text></Text>
                </View>

            </View >
            {(charge.getMileageAtStart() !== undefined || charge.getIsAMergeCharge()) && (
                <View style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 7, flexDirection: 'row', flex: 1, gap: 7, flexWrap: "wrap" }} >
                    {charge.getMileageAtStart() !== undefined && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Icon name="speed" size={18} color={getBlackColour(isDarkMode)} />
                            <Text>{formatNumberWithSpaces(getDistance(charge.getMileageAtStart()!, appPreferences))} {appPreferences.distanceUnits}</Text>
                            {charge.getIsInaccurateMileage() && (
                                <TouchableOpacity
                                    testID="inaccurateMileageButton"
                                    onPress={() => {
                                        Alert.alert(languageHandler.getTranslation('inaccurate_mileage'), languageHandler.getTranslation('inaccurate_mileage_alert'));
                                    }}
                                >
                                    <Icon name="warning" size={18} color="red" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    <View>
                        {charge.getIsAMergeCharge() && (
                            <TouchableOpacity
                                testID="mergeChargeDetailsButton"
                                onPress={() => {
                                    handleModalAnim(true);
                                    setShouldOpenSubChargesModal(true);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center' }}>
                                    <Icon testID={'mergeChargeIcon'} name="merge-type" size={18} color={getBlackColour(isDarkMode)} />
                                    <Text testID={'mergeChargeCount'}>{charge.getSubCharges().length}</Text>

                                    <Icon name="chevron-right" size={18} color={getBlackColour(isDarkMode)} />

                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
            <View style={{ position: 'relative', maxHeight: 10, marginTop: 10 }}>
                <View style={{ backgroundColor: 'lightgray', width: '100%', borderRadius: 100, height: 10 }} />
                <View testID={'chargingBar'} style={
                    {
                        backgroundColor: charge.isV2G ? 'rgb(255,165,0)' : theme.colors.powerGreen,
                        borderRadius: 100, position: 'absolute', height: 10,
                        width: getBarWidth(Math.max(charge.getEndPercentage(), charge.getStartPercentage()))
                    }} />
                <View testID={'chargingStartBar'} style={{ backgroundColor: 'rgb(0,122,255)', width: getBarWidth(Math.min(charge.getStartPercentage(), charge.getEndPercentage())), borderRadius: 100, position: 'absolute', height: 10 }} />
            </View>
            <View style={{ justifyContent: 'space-between', alignItems: 'stretch', marginTop: 7, flexDirection: 'row', flex: 1, gap: 7, flexWrap: "wrap" }} >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Icon name="timer" size={18} color={getBlackColour(isDarkMode)} />
                    <Text testID={'chargeLengthText'} style={{ color: getBlackColour(isDarkMode) }}>{charge.getChargeLength()}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'gray' }}></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Icon name="battery-charging-full" size={18} color={getBlackColour(isDarkMode)} />
                    <Text testID={'batteryPercentageCharged'} style={{ color: getBlackColour(isDarkMode) }} >{charge.getV2GEnergyCharged() > 0 ? '+' : ''}{charge.getEndPercentage() - charge.getStartPercentage()}%</Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'gray' }}></View>
                {charge.isV2G && (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Icon testID={'V2GbatteryChargedIcon'} name="battery-charging-full" size={18} color={getBlackColour(isDarkMode)} />
                            <Text testID={'V2GTotalkWhChargedText'} style={{ color: getBlackColour(isDarkMode) }} >+{charge.getV2GEnergyCharged().toFixed(2)} kWh</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Icon testID={'v2gChargedIcon'} name="house" size={18} color={getBlackColour(isDarkMode)} />
                            <Text testID={'V2GDischargedkWhText'} style={{ color: getBlackColour(isDarkMode) }} >-{charge.getV2GEnergyDischarged().toFixed(2)} kWh</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: 'lightgray', marginVertical: 5 }}></View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Icon testID={'V2GbatteryChargedIcon'} name="electric-car" size={18} color={getBlackColour(isDarkMode)} />
                            <Text testID={'V2GEnergyRecoveredText'} style={{ color: getBlackColour(isDarkMode) }} >{charge.getV2GEnergyCharged() >= 0 ? '+' : ''}{charge.getEnergyRecovered().toFixed(2)} kWh</Text>
                        </View>
                    </View>
                )}
                {!charge.isV2G && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <Icon testID={'batteryChargedIcon'} name="battery-charging-full" size={18} color={getBlackColour(isDarkMode)} />
                        <Text testID={'kwhChargedText'} style={{ color: getBlackColour(isDarkMode) }} >+{charge.getEnergyRecovered().toFixed(2)} kWh</Text>
                    </View>
                )}

                {/* // no need to show average power for v2g sessions */}
                {!charge.isV2G && (
                    <>
                        <View style={{ width: 1, backgroundColor: 'gray' }}></View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <Text style={{ color: getBlackColour(isDarkMode) }}>Ø</Text>
                            <Text testID={'averagePowerText'} style={{ color: getBlackColour(isDarkMode) }} >{charge.getAverageChargeSpeed().toFixed(2)} kW</Text>
                        </View>
                    </>
                )}
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    mainView: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 1,
        shadowRadius: 16.00,
        elevation: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: 10,
    },
    mainViewContent: {
        paddingHorizontal: 15,
    },
})

export default ChargeCard;