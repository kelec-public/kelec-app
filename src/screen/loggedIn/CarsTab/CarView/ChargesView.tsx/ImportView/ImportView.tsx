import React, { useContext, useState } from "react";
import { Alert, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../../../CarsPageView";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../../../../lib/graphics/utils";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import TopNavHeader from "../../../../../Common/Navigation/TopNavHeader";
import FilePickerCard from "./FilePickerCard";
import { spacerXL } from "../../../../../../packages/kelec-model/view/Spacers";
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import RenaultCharge from "../../../../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import ImportPreviewSection from "./ImportPreviewSection";
import Text from "../../../../../Common/CustomText";
import KelecCard from "../../../../../../packages/kelec-model/view/Card";
import RenaultChargesHandler, { TotalChargeDuration } from "../../../../../../lib/clients/apiHandlers/renaultChargesHandler";

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

    const { charges } = route.params;

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
                            // on importe un excel précédemment exporté depuis l'app
                            try {
                                const result = await DocumentPicker.pickSingle({
                                    type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
                                });

                                let fileContent;
                                let workbook;
                                let sheet;
                                let data;
                                try {
                                    fileContent = await RNFS.readFile(result.uri, 'base64');
                                    workbook = XLSX.read(fileContent, { type: 'base64' });
                                    if (workbook.SheetNames.length === 0) {
                                        throw new Error('No sheets found in the Excel file');
                                    }
                                    sheet = workbook.Sheets[workbook.SheetNames[0]];
                                    data = XLSX.utils.sheet_to_json(sheet);
                                } catch (err) {
                                    Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("errorReadingFile"));
                                    return;
                                }

                                // parse charges
                                const rawCharges = data.map((row: any): RenaultCharge | undefined => {
                                    if (
                                        row.chargeStartDate &&
                                        row.chargeEndDate &&
                                        row.chargeDuration &&
                                        row.chargeStartBatteryLevel &&
                                        row.chargeEndBatteryLevel
                                    ) {
                                        // TODO: il faut gérer le parsing vu qu'on a exporté avec toLocaleString
                                        return new RenaultCharge(
                                            row.chargeStartDate,
                                            row.chargeEndDate,
                                            row.chargeDuration,
                                            row.chargeStartBatteryLevel,
                                            row.chargeEndBatteryLevel,
                                            row.chargeEnergyRecovered,
                                            row.chargeEndStatus,
                                            row.isAMergeCharge === 'true',
                                            [],
                                            row.mileageAtStart,
                                            row.inaccurateMileage === 'true',
                                            row.V2GEnergyDischarged,
                                            row.isV2G === 'true',
                                        );
                                    }
                                    return undefined;
                                });

                                const newCharges: RenaultCharge[] = rawCharges.filter((c): c is RenaultCharge => c !== undefined);

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
                                    console.error('Error picking document:', err);
                                }
                            }

                        }}
                    ></FilePickerCard>
                    {pendingCharges && pendingCharges.charges.length === 0 && (
                        <KelecCard>
                            <Text>{languageHandler.getTranslation("noValidChargesFound")}</Text>
                        </KelecCard>
                    )
                    }
                    {pendingCharges && pendingCharges.charges.length > 0 && (
                        <ImportPreviewSection
                            data={{
                                charges: { current: currentChargesCount, imported: currentChargesCount + pendingCharges.charges.length },
                                energy: { current: currentEnergyCount, imported: currentEnergyCount + pendingCharges.addedEnergy },
                                time: { current: currentTimeCount, imported: computeTotalTime(currentTimeCount, pendingCharges.addedTime) },
                            }}
                        />
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