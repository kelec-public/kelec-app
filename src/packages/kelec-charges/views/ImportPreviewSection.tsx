import React from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import { formatNumberWithLeadingZero, getWhiteColour } from "../../../lib/graphics/utils";
import { TotalChargeDuration } from "../../../lib/clients/apiHandlers/renaultChargesHandler";
import KelecCard from "../../kelec-model/view/Card";
import { spacerS } from "../../kelec-model/view/Spacers";
import { NEUTRAL_100, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";

export type ImportPreviewData = {
    charges: { current: number; imported: number };
    energy: { current: number; imported: number };
    time: { current: TotalChargeDuration; imported: TotalChargeDuration };
};

type ImportPreviewSectionProps = {
    readonly data: ImportPreviewData;
};

type PreviewRowCardProps = {
    readonly iconName: string;
    readonly label: string;
    readonly current: string;
    readonly imported: string;
    readonly importedColor: string;
    readonly unit?: string;
    readonly delta?: number;
    readonly backgroundColor: string;
};

function PreviewRowCard({
    iconName,
    label,
    current,
    imported,
    importedColor,
    unit,
    delta,
}: PreviewRowCardProps): React.JSX.Element {
    return (
        <KelecCard>
            <View style={styles.card}>
                <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                        <Icon name={iconName} size={20} color="#3d4a3c" />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardLabel}>{label}</Text>
                        <View style={styles.valueRow}>
                            <Text style={styles.sectionTitle}>{current}</Text>
                            <Icon name="arrow-forward" size={14} color="#3d4a3c" style={styles.arrow} />
                            <Text style={[styles.sectionTitle, { color: importedColor }]}>{imported}</Text>
                            {unit ? <Text style={styles.unit}> {unit}</Text> : null}
                        </View>
                    </View>
                </View>
                {delta !== undefined && delta > 0 ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>+{delta}</Text>
                    </View>
                ) : null}
            </View>
        </KelecCard>
    );
}

function ImportPreviewSection({ data }: ImportPreviewSectionProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === "dark";
    const cardBg = getWhiteColour(isDarkMode);

    const chargesDelta = data.charges.imported - data.charges.current;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{`Aperçu de l'importation`}</Text>
            <View style={styles.cardsContainer}>
                <PreviewRowCard
                    iconName="ev-station"
                    label="CHARGES (TOTAL)"
                    current={String(data.charges.current)}
                    imported={String(data.charges.imported)}
                    importedColor="#006e2b"
                    delta={chargesDelta}
                    backgroundColor={cardBg}
                />
                <PreviewRowCard
                    iconName="bolt"
                    label="ÉNERGIE TOTALE"
                    current={String(data.energy.current)}
                    imported={String(data.energy.imported)}
                    importedColor="#036df7"
                    unit="kWh"
                    backgroundColor={cardBg}
                />
                <PreviewRowCard
                    iconName="hourglass-empty"
                    label="TEMPS TOTAL"
                    current={`${data.time.current.hours}h${formatNumberWithLeadingZero(data.time.current.minutes)}m`}
                    imported={`${data.time.imported.hours}h${formatNumberWithLeadingZero(data.time.imported.minutes)}m`}
                    importedColor="#1b1b1b"
                    backgroundColor={cardBg}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "600",
    },
    cardsContainer: {
        gap: 12,
    },
    card: {
        padding: spacerS,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: NEUTRAL_100,
        alignItems: "center",
        justifyContent: "center",
    },
    cardText: {
        marginLeft: 12,
        gap: 2,
    },
    cardLabel: {
        fontSize: 12,
        letterSpacing: 0.24,
        textTransform: "uppercase",
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    arrow: {
        marginHorizontal: 2,
    },
    unit: {
        fontSize: 16,
        alignSelf: "flex-end",
        marginBottom: 2,
    },
    badge: {
        backgroundColor: PRIMARY_COLOUR,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.24,
    },
});

export default ImportPreviewSection;
