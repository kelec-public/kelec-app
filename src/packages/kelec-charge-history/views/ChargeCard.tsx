import { Alert, DimensionValue, TouchableOpacity, View, useColorScheme, ScrollView } from "react-native";
import Text from "../../../screen/Common/CustomText";
import Charge from "../models/Charge";
import { useContext, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { convertDateForChargeHistory, convertHoursForChargeHistory, formatNumberWithSpaces, getBlackColour, getDistance, getWhiteColour } from "../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import CarsViewContext from "../../../lib/Contexts/CarsViewContext";
import { useTheme } from '@react-navigation/native';
import BottomSheet from "../../../screen/Common/bottomSheet/BottomSheet";
import ChargeCostsContext from "../controllers/ChargeCostsContext";

type ChargeCardProps = {
    readonly charge: Charge;
    /** Avant d'ouvrir la modification du prix (ex. fermer la feuille des sous-charges). */
    readonly onBeforeEditCost?: () => void;
}

/** Bas de la carte : le coût à gauche (s'il est connu), le type de charge à droite. */
function ChargeCardFooter({ charge }: { readonly charge: Charge }): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const costs = useContext(ChargeCostsContext);
    const cost = costs?.costOf(charge) ?? null;
    const isDC = charge.isDCCharge();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 7 }}>
            {/* coût : prix saisi à la main, ou tarif de la maison */}
            {costs && cost !== null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
                    <Icon name="payments" size={18} color={getBlackColour(isDarkMode)} />
                    <Text testID={'chargeCostText'} style={{ color: getBlackColour(isDarkMode) }}>{costs.format(cost)}</Text>
                    {/* prix saisi à la main (pour une charge fusionnée : pour une de ses sous-charges) */}
                    {costs.isManual(charge) && <Icon testID={'manualCostIcon'} name="edit" size={14} color={getBlackColour(isDarkMode)} />}
                </View>
            ) : <View />}
            {/* prise Type 2 en AC, CCS2 en DC */}
            <View testID={'chargeCurrentType'} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <CommunityIcon name={isDC ? 'ev-plug-ccs2' : 'ev-plug-type2'} size={18} color={getBlackColour(isDarkMode)} />
                <Text style={{ color: getBlackColour(isDarkMode) }}>{isDC ? 'DC' : 'AC'}</Text>
            </View>
        </View>
    );
}

function ChargeCard({ charge, onBeforeEditCost }: ChargeCardProps): React.JSX.Element {

    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme()

    const { appPreferences, languageHandler } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);
    const costs = useContext(ChargeCostsContext);
    // une charge fusionnée n'a pas de prix à elle : on modifie celui de ses sous-charges, dans leur détail
    const editCost = costs?.edit && !charge.getIsAMergeCharge()
        ? () => {
            onBeforeEditCost?.();
            costs.edit!(charge);
        }
        : undefined;

    const getBackgroundColour = () => {
        if (appPreferences.highlightDCCharges && charge.isDCCharge()) {
            return isDarkMode ? 'rgba(0,142,255,0.5)' : 'rgba(0,142,255,0.2)';
        } else {
            return getWhiteColour(isDarkMode);
        }
    }

    const getBarWidth = (unit: number): DimensionValue => {
        return unit.toString() + '%' as DimensionValue;
    }

    const [shouldOpenSubChargesModal, setShouldOpenSubChargesModal] = useState(false);
    const CardContainer = editCost ? TouchableOpacity : View;

    return (
        // toute la carte ouvre la modification du prix (les boutons qu'elle contient gardent leur action)
        <CardContainer
            testID={'ChargeCard'}
            onPress={editCost}
            style={{ padding: 15, backgroundColor: getBackgroundColour(), marginHorizontal: 10, marginTop: 0, borderRadius: 7 }}
        >
            <BottomSheet
                testID="mergeViewBottomSheet"
                onClose={() => {
                    setShouldOpenSubChargesModal(false);
                    handleModalAnim(false);
                }}
                visible={shouldOpenSubChargesModal}
                title={languageHandler.getTranslation('mergeCharges')}
            >

                {/* espace entre les sous-charges : les cartes ont le même fond, elles se collaient */}
                <ScrollView contentContainerStyle={{ paddingBottom: 20, gap: 10 }}>
                    {charge.getSubCharges().map((subCharge) => (
                        <ChargeCard
                            key={subCharge.getStartDate().toISOString()}
                            charge={subCharge}
                            onBeforeEditCost={() => {
                                setShouldOpenSubChargesModal(false);
                                handleModalAnim(false);
                            }}
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
            <ChargeCardFooter charge={charge} />
        </CardContainer>
    );
}

export default ChargeCard;