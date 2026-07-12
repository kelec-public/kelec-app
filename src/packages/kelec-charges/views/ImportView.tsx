import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../../../screen/loggedIn/CarsTab/CarsPageView";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../lib/graphics/utils";
import MainContext from "../../../lib/Contexts/MainContext";
import TopNavHeader from "../../../screen/Common/Navigation/TopNavHeader";
import FilePickerCard from "./ImportFilePickerCard";
import { spacerXL } from "../../kelec-model/view/Spacers";
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import RenaultCharge from "../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import ImportPreviewSection from "./ImportPreviewSection";
import Text from "../../../screen/Common/CustomText";
import KelecCard from "../../kelec-model/view/Card";
import RenaultChargesHandler, { TotalChargeDuration } from "../../../lib/clients/apiHandlers/renaultChargesHandler";
import ChargeCard from "../../../screen/loggedIn/CarsTab/CarView/ChargesView.tsx/ChargeCard";
import FullScreenLoading from "../../../FullScreenLoading";
import { buildDateParser } from "../service/dateParser";
import { parseChargesFromExcel } from "../service/excelImportService";

export type PendingImportChargeData = {
    charges: RenaultCharge[];
    addedEnergy: number;
    addedTime: TotalChargeDuration
}

type ImportViewProps = NativeStackScreenProps<CarsViewParamList, 'ImportChargesView'>;

function ImportChargesView({ navigation, route }: ImportViewProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);

    const [pendingCharges, setPendingCharges] = useState<PendingImportChargeData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { charges, carType } = route.params;

    const currentChargesCount = charges.getCharges().length;
    const currentEnergyCount = charges.getTotalEnergyRecovered();
    const currentTimeCount = charges.getTotalTimeCharging();


    const computeTotalTime = (currentTime: TotalChargeDuration, addedTime: TotalChargeDuration): TotalChargeDuration => {
        let totalMinutes = currentTime.minutes + addedTime.minutes;
        let totalHours = currentTime.hours + addedTime.hours + Math.floor(totalMinutes / 60);
        totalMinutes = totalMinutes % 60;
        return {
            hours: totalHours,
            minutes: totalMinutes
        }
    }

    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode) }]}
            testID="ImportChargesView"
        >
            <TopNavHeader
                navigation={navigation}
                title={languageHandler.getTranslation("importCharges")}
                rightIcon={
                    <View style={{ width: 30 }} />
                }
            ></TopNavHeader>
            <ScrollView style={styles.scrollView}>
                <View style={styles.view}>
                    <FilePickerCard
                        onPress={async () => {
                            setIsLoading(true);
                            // on importe un excel précédemment exporté depuis l'app
                            try {
                                const result = await DocumentPicker.pickSingle({
                                    type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
                                });

                                const newCharges = await parseChargesFromExcel(result);

                                // ensuite on retire les charges qui sont déjà là pour éviter les duplicats
                                newCharges.filter(charge => {
                                    return !charges.getCharges().some(existingCharge => (
                                        existingCharge.getStartDate().getTime() === charge.getStartDate().getTime()
                                    ))
                                });
                                const chargeHandler = new RenaultChargesHandler(newCharges);

                                setPendingCharges({ charges: newCharges, addedEnergy: chargeHandler.getTotalEnergyRecovered(), addedTime: chargeHandler.getTotalTimeCharging() });
                            } catch (err) {
                                if (DocumentPicker.isCancel(err)) {
                                    // rien à faire
                                } else {
                                    Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("errorReadingFile"));
                                    console.error('Error picking document:', err);
                                }
                            } finally {
                                setIsLoading(false);
                            }

                        }}
                    ></FilePickerCard>
                    {isLoading && (
                        <FullScreenLoading></FullScreenLoading>
                    )}

                    {pendingCharges && pendingCharges.charges.length === 0 && (
                        <KelecCard>
                            <Text>{languageHandler.getTranslation("noValidChargesFound")}</Text>
                        </KelecCard>
                    )
                    }
                    {pendingCharges && pendingCharges.charges.length > 0 && (
                        <>
                            <ImportPreviewSection
                                data={{
                                    charges: { current: currentChargesCount, imported: currentChargesCount + pendingCharges.charges.length },
                                    energy: { current: currentEnergyCount, imported: currentEnergyCount + pendingCharges.addedEnergy },
                                    time: { current: currentTimeCount, imported: computeTotalTime(currentTimeCount, pendingCharges.addedTime) },
                                }}
                            />

                            {/* {pendingCharges.charges.map((charge, index) => (
                                <ChargeCard
                                    key={index}
                                    charge={charge}
                                    carType={carType}
                                ></ChargeCard>
                            ))} */}

                        </>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        padding: spacerXL,
    },
    view: {
        display: 'flex',
        flexDirection: 'column',
        gap: spacerXL,
    }
})

export default ImportChargesView;