import { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import TariffPageLayout from "./TariffPageLayout";
import Button from "../../kelec-model/view/Button";
import KelecCard from "../../kelec-model/view/Card";
import { BLACK_COLOUR, NEUTRAL_200, NEUTRAL_300, ORANGE_ONE, PRIMARY_COLOUR, SECONDARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerL, spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, subTitle3, textBody } from "../../kelec-model/view/Titles";
import { Currency, minutesOfDay, OffPeakSlot, parseLocalDate, Tariff, TariffKind, TimeOfDay, timeOfDayFromDate, toLocalDate } from "../models/Tariff";
import { DEFAULT_OFF_PEAK_SLOT, parsePrice, TariffDraft } from "../models/tariffDraft";
import ChoicePills from "./ChoicePills";
import PickerButton from "./PickerButton";
import PriceRow from "./PriceRow";
import OffPeakTimeline from "./OffPeakTimeline";
import { tariffEnd, withPeriod } from "../services/tariffList";
import { currencySymbol, formatLocalDate } from "../services/priceFormat";
import { formatDuration, offPeakMinutesPerDay, offPeakSaving } from "../services/offPeakSummary";

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

/** « 22:00 » → aujourd'hui à 22:00, pour le sélecteur d'heure. */
function timeAsDate(time: TimeOfDay): Date {
    const minutes = minutesOfDay(time);
    const date = new Date();
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date;
}

/**
 * Saisie d'un tarif : période, type, carte des prix au kWh,
 * puis pour les heures pleines / creuses une carte des plages avec la journée en frise.
 */
function TariffEditorView({ draft, tariffs, currency, canDelete, onChange, onSave, onDelete, onBack }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    const unit = `${currencySymbol(currency)}/kWh`;
    const periodEnd = tariffEnd(withPeriod(tariffs, draft), draft.id);
    const saving = offPeakSaving(parsePrice(draft.peakPrice), parsePrice(draft.offPeakPrice));

    const updateSlot = (index: number, patch: Partial<OffPeakSlot>) => {
        onChange({ offPeakSlots: draft.offPeakSlots.map((slot, i) => i === index ? { ...slot, ...patch } : slot) });
    };

    const kindChoices = (['flat', 'peakOffPeak'] as TariffKind[]).map(kind => (
        { value: kind, label: t(kind === 'flat' ? "flatRate" : "peakOffPeak"), testID: 'tariffKind' + kind }
    ));

    const badge = (text: string, testID: string) => (
        <View testID={testID} style={styles.badge}>
            <Text style={[subTitle3, styles.badgeText]}>{text}</Text>
        </View>
    );

    const cardHeader = (title: string, caption?: string, badgeElement?: React.ReactNode) => (
        <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
                <Text style={textBody}>{title}</Text>
                {caption && <Text style={[subTitle2, { color: NEUTRAL_300 }]}>{caption}</Text>}
            </View>
            {badgeElement}
        </View>
    );

    const timeButton = (testID: string, value: TimeOfDay, onTimeChange: (time: TimeOfDay) => void) => (
        <PickerButton mode="time" testID={testID} value={timeAsDate(value)} label={value} onChange={date => onTimeChange(timeOfDayFromDate(date))} />
    );

    return (
        <TariffPageLayout
            testID="tariffEditorView"
            title={t("electricityTariff")}
            onBack={onBack}
            backTestID="tariffEditorBackButton"
            action={{ icon: "check", onPress: onSave, testID: "saveTariffButton" }}
            footer={canDelete && (
                <Button
                    testID="deleteTariffButton"
                    buttonStyle={theme.buttons.neutral}
                    text={t("deleteTariff")}
                    onPress={onDelete}
                />
            )}
        >
            <View style={styles.content}>
                <View testID="tariffPeriod" style={styles.period}>
                    <View style={styles.periodRow}>
                        <Text style={[subTitle2, styles.periodLabel]}>{t("applicationPeriod").toUpperCase()}</Text>
                        {draft.validFrom === null ? (
                            <Text style={textBody}>{t("sinceTheBeginning")}</Text>
                        ) : (
                            <PickerButton
                                mode="date"
                                testID="dateButtonvalidFrom"
                                value={parseLocalDate(draft.validFrom)}
                                label={`${t("fromDate")} ${formatLocalDate(draft.validFrom)}`}
                                onChange={date => onChange({ validFrom: toLocalDate(date) })}
                            />
                        )}
                    </View>
                    {periodEnd && <Text style={[subTitle2, styles.periodEnd]}>{`${t("untilDate")} ${formatLocalDate(periodEnd)}`}</Text>}
                </View>

                <ChoicePills choices={kindChoices} selected={draft.kind} onSelect={kind => onChange({ kind })} />

                <KelecCard>
                    <View style={styles.card}>
                        {cardHeader(t("pricePerKwh"), undefined, draft.kind === 'peakOffPeak' && saving !== null
                            ? badge(t("offPeakSaving").replace('{percent}', String(saving)), 'offPeakSavingBadge')
                            : undefined)}
                        {draft.kind === 'flat' ? (
                            <PriceRow
                                testID="priceInputpricePerKwh"
                                icon="bolt"
                                iconColour={PRIMARY_COLOUR}
                                label={t("flatRate")}
                                value={draft.pricePerKwh}
                                onChangeText={pricePerKwh => onChange({ pricePerKwh })}
                                unit={unit}
                            />
                        ) : (
                            <>
                                <PriceRow
                                    testID="priceInputpeakPrice"
                                    icon="wb-sunny"
                                    iconColour={ORANGE_ONE}
                                    label={t("peakPrice")}
                                    value={draft.peakPrice}
                                    onChangeText={peakPrice => onChange({ peakPrice })}
                                    unit={unit}
                                />
                                <View style={styles.separator} />
                                <PriceRow
                                    testID="priceInputoffPeakPrice"
                                    icon="nightlight-round"
                                    iconColour={PRIMARY_COLOUR}
                                    label={t("offPeakPrice")}
                                    value={draft.offPeakPrice}
                                    onChangeText={offPeakPrice => onChange({ offPeakPrice })}
                                    unit={unit}
                                />
                            </>
                        )}
                    </View>
                </KelecCard>

                {draft.kind === 'peakOffPeak' && (
                    <KelecCard>
                        <View style={styles.card}>
                            {cardHeader(
                                t("offPeakSlots"),
                                t("offPeakTotalPerDay").replace('{duration}', formatDuration(offPeakMinutesPerDay(draft.offPeakSlots))),
                            )}
                            <OffPeakTimeline slots={draft.offPeakSlots} />
                            {draft.offPeakSlots.map((slot, index) => (
                                // les plages n'ont pas d'identifiant
                                <View key={index} style={[styles.slotRow, { backgroundColor: theme.colors.background }]}>
                                    {timeButton('slotStart' + index, slot.start, start => updateSlot(index, { start }))}
                                    <Icon name="arrow-forward" size={spacerL} color={NEUTRAL_300} />
                                    {timeButton('slotEnd' + index, slot.end, end => updateSlot(index, { end }))}
                                    <View style={styles.spacer} />
                                    <TouchableOpacity
                                        testID={'removeSlot' + index}
                                        accessibilityRole="button"
                                        onPress={() => onChange({ offPeakSlots: draft.offPeakSlots.filter((_, i) => i !== index) })}
                                    >
                                        <Icon name="delete-outline" size={spacerXL} color={BLACK_COLOUR(isDarkMode)} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                testID="addOffPeakSlotButton"
                                accessibilityRole="button"
                                onPress={() => onChange({ offPeakSlots: [...draft.offPeakSlots, DEFAULT_OFF_PEAK_SLOT] })}
                                style={styles.addSlot}
                            >
                                <Icon name="add" size={spacerXL} color={PRIMARY_COLOUR} />
                                <Text style={[textBody, styles.addSlotText]}>{t("addOffPeakSlot")}</Text>
                            </TouchableOpacity>
                        </View>
                    </KelecCard>
                )}

            </View>
        </TariffPageLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        gap: spacerXL,
    },
    period: {
        gap: spacerS,
    },
    periodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacerM,
    },
    periodLabel: {
        color: NEUTRAL_300,
        letterSpacing: 1,
        flexShrink: 1,
    },
    periodEnd: {
        color: NEUTRAL_300,
        textAlign: 'right',
    },
    card: {
        flex: 1,
        gap: spacerL,
        padding: spacerS,
    },
    cardHeader: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacerM,
    },
    cardTitle: {
        flexShrink: 1,
        gap: 2,
    },
    badge: {
        backgroundColor: PRIMARY_COLOUR + '26',
        borderRadius: 999,
        paddingVertical: spacerS,
        paddingHorizontal: spacerM,
    },
    badgeText: {
        color: SECONDARY_COLOUR,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: NEUTRAL_200,
    },
    slotRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacerM,
        padding: spacerM,
        borderRadius: spacerM,
    },
    spacer: {
        flex: 1,
    },
    addSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacerS,
        padding: spacerM,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: NEUTRAL_200,
        borderRadius: spacerM,
    },
    addSlotText: {
        flexShrink: 1,
        textAlign: 'center',
    },
});

export default TariffEditorView;
