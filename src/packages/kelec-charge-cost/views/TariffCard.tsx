import { useContext } from "react";
import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import KelecCard from "../../kelec-model/view/Card";
import { BLACK_COLOUR, NEUTRAL_300, ORANGE_ONE, PRIMARY_COLOUR, SECONDARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerM, spacerS, spacerXL } from "../../kelec-model/view/Spacers";
import { subTitle2, textBody, title2 } from "../../kelec-model/view/Titles";
import { Currency, OffPeakSlot, Tariff } from "../models/Tariff";
import { daySchedules, formatDays, formatDuration, offPeakMinutesPerDay, offPeakSaving, peakSlots } from "../services/offPeakSummary";
import { currencySymbol, formatKwhPrice } from "../services/priceFormat";
import { TariffPeriod, TariffStatus } from "../services/tariffList";
import Badge from "./Badge";
import IconBox from "./IconBox";
import { periodLabel } from "./tariffLabels";

type Props = {
    readonly tariff: Tariff;
    readonly tariffs: TariffPeriod[];
    readonly currency: Currency;
    readonly status: TariffStatus;
    readonly onPress: () => void;
    readonly testID: string;
};

const STATUS_LABELS: Record<TariffStatus, string> = {
    current: "tariffActive",
    past: "tariffArchived",
    upcoming: "tariffUpcoming",
};

const slotsText = (slots: OffPeakSlot[]) => slots.map(slot => `${slot.start} → ${slot.end}`).join(', ');

/**
 * Plages d'heures pleines et creuses en texte : une ligne par groupe de jours (« lun. – ven. : 22:00 → 06:00 (8 h) »)
 * quand elles changent selon le jour. Les jours sans heures creuses sont « toute la journée » en heures pleines.
 */
function slotCaptions(offPeakSlots: OffPeakSlot[], allDay: string): { peak: string; offPeak: string } {
    const schedules = daySchedules(offPeakSlots);
    const offPeakText = (slots: OffPeakSlot[]) => `${slotsText(slots)} (${formatDuration(offPeakMinutesPerDay(slots))})`;
    if (schedules.length === 1) {
        return { peak: slotsText(peakSlots(offPeakSlots)), offPeak: offPeakText(offPeakSlots) };
    }
    const lines = (text: (slots: OffPeakSlot[]) => string | null) => schedules.flatMap(schedule => {
        const line = text(schedule.slots);
        return line === null ? [] : [`${formatDays(schedule.days)} : ${line}`];
    }).join('\n');
    return {
        peak: lines(slots => {
            if (slots.length === 0) return allDay;
            const peak = peakSlots(slots);
            return peak.length === 0 ? null : slotsText(peak);
        }),
        offPeak: lines(slots => slots.length === 0 ? null : offPeakText(slots)),
    };
}

/** Un tarif de la liste : état, type, période, puis une ligne par prix. Toute la carte ouvre la saisie du tarif. */
function TariffCard({ tariff, tariffs, currency, status, onPress, testID }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);
    const unit = `${currencySymbol(currency)}/kWh`;

    const priceLine = (line: {
        icon: string; iconColour: string; label: string; caption?: string; badge?: React.ReactNode;
        price: number; highlighted?: boolean;
    }) => (
        <View style={[
            styles.priceLine,
            { backgroundColor: line.highlighted ? PRIMARY_COLOUR + '14' : theme.colors.background },
        ]}>
            <IconBox icon={line.icon} colour={line.iconColour} />
            <View style={styles.priceText}>
                <View style={styles.labelRow}>
                    <Text style={textBody}>{line.label}</Text>
                    {line.badge}
                </View>
                {!!line.caption && <Text style={[subTitle2, { color: NEUTRAL_300 }]}>{line.caption}</Text>}
            </View>
            <View style={styles.price}>
                <Text style={[title2, line.highlighted && { color: SECONDARY_COLOUR }]}>{formatKwhPrice(line.price)}</Text>
                <Text style={[subTitle2, { color: NEUTRAL_300 }]}>{unit}</Text>
            </View>
        </View>
    );

    const saving = tariff.kind === 'peakOffPeak' ? offPeakSaving(tariff.peakPrice, tariff.offPeakPrice) : null;
    const captions = tariff.kind === 'peakOffPeak' ? slotCaptions(tariff.offPeakSlots, t("allDay")) : null;

    return (
        <TouchableOpacity testID={testID} onPress={onPress} accessibilityRole="button">
            <KelecCard isSelected={status === 'current'}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.badges}>
                            <Badge
                                testID={testID + 'Status'}
                                text={t(STATUS_LABELS[status])}
                                variant={status === 'current' ? 'success' : 'neutral'}
                                withDot={status === 'current'}
                            />
                            <Badge text={t(tariff.kind === 'flat' ? "flatRate" : "peakOffPeak")} variant="neutral" />
                        </View>
                        <Icon name="keyboard-arrow-right" size={spacerXL} color={BLACK_COLOUR(isDarkMode)} />
                    </View>
                    <Text style={title2}>{periodLabel(tariffs, tariff, t)}</Text>
                    {tariff.kind === 'flat' ? (
                        priceLine({ icon: "bolt", iconColour: PRIMARY_COLOUR, label: t("flatRate"), price: tariff.pricePerKwh })
                    ) : (
                        <>
                            {priceLine({
                                icon: "wb-sunny", iconColour: ORANGE_ONE, label: t("peakPrice"),
                                caption: captions?.peak, price: tariff.peakPrice,
                            })}
                            {priceLine({
                                icon: "nightlight-round", iconColour: PRIMARY_COLOUR, label: t("offPeakPrice"),
                                caption: captions?.offPeak,
                                badge: saving !== null ? <Badge text={`-${saving} %`} /> : undefined,
                                price: tariff.offPeakPrice, highlighted: true,
                            })}
                        </>
                    )}
                </View>
            </KelecCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        gap: spacerM,
        padding: spacerS,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
    badges: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacerS,
    },
    priceLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
        padding: spacerM,
        borderRadius: spacerM,
    },
    priceText: {
        flex: 1,
        gap: 2,
    },
    labelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacerS,
    },
    price: {
        alignItems: 'flex-end',
    },
});

export default TariffCard;
