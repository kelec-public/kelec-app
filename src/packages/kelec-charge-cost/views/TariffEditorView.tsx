import { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import TextInput from "../../../screen/Common/TextInput";
import DatePickerField from "../../../screen/loggedIn/CarsTab/CarView/Elements/DatePicker";
import TariffPageLayout from "./TariffPageLayout";
import Button from "../../kelec-model/view/Button";
import SpacedRow from "../../kelec-model/view/SpacedRow";
import { BLACK_COLOUR } from "../../kelec-model/lib/colours";
import { spacerM, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle } from "../../kelec-model/view/Titles";
import { Currency, OffPeakSlot, parseLocalDate, Tariff, TariffKind, toLocalDate } from "../models/Tariff";
import { DEFAULT_OFF_PEAK_SLOT, TariffDraft } from "../models/tariffDraft";
import ChoicePills from "./ChoicePills";
import TimePickerField from "./TimePickerField";
import { periodLabel } from "./tariffLabels";
import { withPeriod } from "../services/tariffList";

type Props = {
    readonly draft: TariffDraft;
    readonly tariffs: Tariff[];
    readonly currency: Currency;
    readonly canDelete: boolean;
    readonly onChange: (patch: Partial<TariffDraft>) => void;
    readonly onSave: () => void;
    readonly onDelete: () => void;
    readonly onBack: () => void;
};

type PriceField = 'pricePerKwh' | 'peakPrice' | 'offPeakPrice';

/** Saisie d'un tarif : date de début, prix fixe ou heures pleines / creuses avec leurs plages. */
function TariffEditorView({ draft, tariffs, currency, canDelete, onChange, onSave, onDelete, onBack }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    const priceRow = (field: PriceField) => (
        <SpacedRow>
            <Text style={[subTitle, styles.label]}>{t(field)}</Text>
            <View style={styles.priceInput}>
                <TextInput
                    testID={'priceInput' + field}
                    placeholder="0,00"
                    value={draft[field]}
                    onChangeText={text => onChange({ [field]: text })}
                    keyboardType="decimal-pad"
                />
                <Text>{`${currency}/kWh`}</Text>
            </View>
        </SpacedRow>
    );

    const updateSlot = (index: number, patch: Partial<OffPeakSlot>) => {
        onChange({ offPeakSlots: draft.offPeakSlots.map((slot, i) => i === index ? { ...slot, ...patch } : slot) });
    };

    const kindChoices = (['flat', 'peakOffPeak'] as TariffKind[]).map(kind => (
        { value: kind, label: t(kind === 'flat' ? "flatRate" : "peakOffPeak"), testID: 'tariffKind' + kind }
    ));

    return (
        <TariffPageLayout
            testID="tariffEditorView"
            title={t("electricityTariff")}
            onBack={onBack}
            backTestID="tariffEditorBackButton"
            action={{ icon: "check", onPress: onSave, testID: "saveTariffButton" }}
        >
            <View style={styles.content}>
                <Text testID="tariffPeriod" style={subTitle}>{periodLabel(withPeriod(tariffs, draft), draft, t)}</Text>
                {draft.validFrom !== null && (
                    <View style={styles.section}>
                        <Text style={subTitle}>{t("validFrom")}</Text>
                        <DatePickerField
                            dateValue={parseLocalDate(draft.validFrom)}
                            updateDate={date => onChange({ validFrom: toLocalDate(date) })}
                            placeholder="validFrom"
                        />
                    </View>
                )}
                <ChoicePills choices={kindChoices} selected={draft.kind} onSelect={kind => onChange({ kind })} />

                {draft.kind === 'flat' ? priceRow('pricePerKwh') : (
                    <View style={styles.section}>
                        {priceRow('peakPrice')}
                        {priceRow('offPeakPrice')}
                        <Text style={subTitle}>{t("offPeakSlots")}</Text>
                        {draft.offPeakSlots.map((slot, index) => (
                            // les plages n'ont pas d'identifiant
                            <View key={index} style={styles.slotRow}>
                                <TimePickerField testID={'slotStart' + index} value={slot.start} onChange={start => updateSlot(index, { start })} />
                                <Text>→</Text>
                                <TimePickerField testID={'slotEnd' + index} value={slot.end} onChange={end => updateSlot(index, { end })} />
                                <TouchableOpacity
                                    testID={'removeSlot' + index}
                                    onPress={() => onChange({ offPeakSlots: draft.offPeakSlots.filter((_, i) => i !== index) })}
                                >
                                    <Icon name="delete-outline" size={spacerXL} color={BLACK_COLOUR(isDarkMode)} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <Button
                            testID="addOffPeakSlotButton"
                            buttonStyle={theme.buttons.neutral}
                            text={t("addOffPeakSlot")}
                            onPress={() => onChange({ offPeakSlots: [...draft.offPeakSlots, DEFAULT_OFF_PEAK_SLOT] })}
                        />
                    </View>
                )}

                {canDelete && (
                    <Button
                        testID="deleteTariffButton"
                        buttonStyle={theme.buttons.neutral}
                        text={t("deleteTariff")}
                        onPress={onDelete}
                    />
                )}
            </View>
        </TariffPageLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: spacerXL,
    },
    section: {
        gap: spacerM,
    },
    label: {
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    priceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
});

export default TariffEditorView;
