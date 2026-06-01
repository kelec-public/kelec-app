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
import ChargeCard from "../ChargeCard";

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

                                const dateStrings = newCharges.flatMap(c => [c.chargeStartDate!, c.chargeEndDate!]);
                                const parse = buildDateParser(dateStrings);

                                newCharges.forEach(charge => {
                                    const parsedStart = parse(charge.chargeStartDate ?? '');
                                    const parsedEnd = parse(charge.chargeEndDate ?? '');
                                    if (!parsedStart || !parsedEnd) {
                                        throw new Error('Invalid date format in the Excel file');
                                    }
                                    charge.chargeStartDate = parsedStart.toISOString();
                                    charge.chargeEndDate = parsedEnd.toISOString();
                                });

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

                        <>
                            <ImportPreviewSection
                                data={{
                                    charges: { current: currentChargesCount, imported: currentChargesCount + pendingCharges.charges.length },
                                    energy: { current: currentEnergyCount, imported: currentEnergyCount + pendingCharges.addedEnergy },
                                    time: { current: currentTimeCount, imported: computeTotalTime(currentTimeCount, pendingCharges.addedTime) },
                                }}
                            />

                            {pendingCharges.charges.map((charge, index) => (
                                <ChargeCard
                                    key={index}
                                    charge={charge}
                                    carType={carType}
                                ></ChargeCard>
                            ))}

                        </>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

type DateOrder = 'DMY' | 'MDY' | 'YMD';
type DateParser = (raw: string) => Date | null;

function buildDateParser(samples: string[]): DateParser {
    const norm = (s: string): string => s.replace(/[\u202f\u00a0]/g, ' ').trim();
    const cleaned = samples.map(norm);

    const hasAmPm = cleaned.some(s => /\b(AM|PM)\b/i.test(s));
    const usesDash = cleaned.some(s => /^\d{4}-\d{1,2}-\d{1,2}/.test(s)); // ISO / en-CA

    // 1) Détermine l'ordre via une valeur où un nombre > 12 (preuve directe)
    let order: DateOrder | null = null;
    for (const s of cleaned) {
        const m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.]\d{4}/);
        if (m) {
            if (+m[1] > 12) { order = 'DMY'; break; }
            if (+m[2] > 12) { order = 'MDY'; break; }
        }
    }
    // 2) Sinon, hypothèse par famille
    if (usesDash) order = 'YMD';
    else if (!order) order = hasAmPm ? 'MDY' : 'DMY'; // US 12h vs fr/GB/fi/de

    // Parseur configuré pour CE fichier
    return function parse(raw: string): Date | null {
        const s = norm(raw);
        const n: number[] | undefined = s.match(/\d+/g)?.map(Number);
        if (!n || n.length < 3) return null;

        let y: number, mo: number, d: number, h = 0, mi = 0, se = 0;
        if (order === 'YMD') { [y, mo, d, h = 0, mi = 0, se = 0] = n; }
        else if (order === 'DMY') { [d, mo, y, h = 0, mi = 0, se = 0] = n; }
        else { [mo, d, y, h = 0, mi = 0, se = 0] = n; }

        if (/\bPM\b/i.test(s) && h < 12) h += 12;  // 12h -> 24h
        if (/\bAM\b/i.test(s) && h === 12) h = 0;

        return new Date(y, mo - 1, d, h, mi, se);
    };
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