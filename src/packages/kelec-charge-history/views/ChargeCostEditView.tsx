import { useContext } from "react";
import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { convertDateForChargeHistory, convertHoursForChargeHistory, getWhiteColour } from "../../../lib/graphics/utils";
import Text from "../../../screen/Common/CustomText";
import TextInput from "../../../screen/Common/TextInput";
import PageHeader from "../../kelec-model/view/PageHeader";
import Button from "../../kelec-model/view/Button";
import SpacedRow from "../../kelec-model/view/SpacedRow";
import { spacerL, spacerM, spacerXL, spacerXXL } from "../../kelec-model/view/Spacers";
import { subTitle, subTitle2, textBody } from "../../kelec-model/view/Titles";
import { formatPrice, formatPricePerKwh } from "../../kelec-charge-cost";
import { useChargeCostEditor } from "../controllers/useChargeCostEditor";

type Props = {
    readonly chargeStartDate: string;
    readonly onBack: () => void;
    /** Après l'enregistrement ou le retour au tarif (en général : retour à l'historique). */
    readonly onDone: () => void;
};

/** Page « prix de la charge » (route `CHARGE_COST_ROUTE`) : montant payé, saisi à la main, ou retour au tarif. */
function ChargeCostEditView({ chargeStartDate, onBack, onDone }: Props): React.JSX.Element | null {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const editor = useChargeCostEditor(chargeStartDate, onDone);
    const { charge, currency } = editor;
    if (!charge || !currency) return null;

    const start = charge.getStartDate();
    const end = charge.getEndDate();
    const when = charge.getIsSameDay()
        ? `${convertDateForChargeHistory(start, false)} ${convertHoursForChargeHistory(start, end)}`
        : `${convertDateForChargeHistory(start, true)} -> ${convertDateForChargeHistory(end, true)}`;

    return (
        <SafeAreaView
            testID="chargeCostEditView"
            edges={['top']}
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode) }]}
        >
            <PageHeader
                title={t("chargeCost")}
                onBack={onBack}
                backTestID="chargeCostBackButton"
                action={{ icon: "check", onPress: editor.save, testID: "saveChargeCostButton" }}
            />
            <View style={commonStyles.navSeparator} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
            >
                <View style={styles.section}>
                    <Text style={textBody}>{when}</Text>
                    <Text style={subTitle2}>{`+${charge.getEnergyRecovered().toFixed(2)} kWh`}</Text>
                    {editor.tariffCost !== null && (
                        <Text testID="tariffCostText" style={subTitle2}>{`${t("costWithTariff")} : ${formatPrice(editor.tariffCost, currency)}`}</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <SpacedRow>
                        <Text style={[subTitle, styles.label]}>{t("manualPrice")}</Text>
                        <View style={styles.amountInput}>
                            <TextInput
                                testID="chargeCostInput"
                                placeholder="0,00"
                                value={editor.amount}
                                onChangeText={editor.setAmount}
                                keyboardType="decimal-pad"
                            />
                            <Text>{currency}</Text>
                        </View>
                    </SpacedRow>
                    {editor.pricePerKwh !== null && (
                        <Text testID="chargeCostPerKwh" style={subTitle2}>{formatPricePerKwh(editor.pricePerKwh, currency)}</Text>
                    )}
                </View>

                {editor.isManual && (
                    <Button
                        testID="resetChargeCostButton"
                        buttonStyle={theme.buttons.neutral}
                        text={t("resetToDefaultTariff")}
                        onPress={editor.resetToTariff}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacerL,
        paddingBottom: spacerXXL,
        gap: spacerXL,
    },
    section: {
        gap: spacerM,
    },
    label: {
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
});

export default ChargeCostEditView;
