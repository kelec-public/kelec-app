import { StyleSheet, View, useColorScheme } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import { formatNumberWithLeadingZero } from "../../../lib/graphics/utils";
import { BLACK_COLOUR, NEUTRAL_100, NEUTRAL_200, NEUTRAL_300, NEUTRAL_450, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerL, spacerM, spacerS } from "../../kelec-model/view/Spacers";
import { subTitle3, title2 } from "../../kelec-model/view/Titles";
import { BeforeAfter, ImportSummary } from "../models/ImportPreview";

type Labels = {
    title: string;
    charges: string;
    energy: string;
    time: string;
    /** Textes déjà traduits et remplis, absents s'il n'y a rien à signaler. */
    alreadyKnown?: string;
    rejected?: string;
};

type Props = {
    readonly summary: ImportSummary;
    readonly labels: Labels;
};

const formatMinutes = (minutes: number): string =>
    `${Math.floor(minutes / 60)}h${formatNumberWithLeadingZero(minutes % 60)}`;

type RowProps = {
    readonly testID: string;
    readonly icon: string;
    readonly label: string;
    readonly values: BeforeAfter;
    readonly format?: (value: number) => string;
    readonly unit?: string;
};

/** Une ligne « avant → après », avec le nombre ajouté en badge. */
function PreviewRow({ testID, icon, label, values, format = String, unit }: RowProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const added = values.after - values.before;

    return (
        <View style={styles.row} testID={testID}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? NEUTRAL_450 : NEUTRAL_100 }]}>
                <Icon name={icon} size={20} color={BLACK_COLOUR(isDarkMode)} />
            </View>
            <View style={styles.rowText}>
                <Text style={[subTitle3, styles.label]}>{label}</Text>
                <View style={styles.values}>
                    <Text style={styles.value} testID={`${testID}Before`}>{format(values.before)}</Text>
                    <Icon name="arrow-forward" size={14} color={NEUTRAL_300} />
                    <Text style={[styles.value, styles.after]} testID={`${testID}After`}>{format(values.after)}</Text>
                    {unit && <Text style={styles.unit}>{unit}</Text>}
                </View>
            </View>
            {added > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>+{format(parseFloat(added.toFixed(2)))}</Text>
                </View>
            )}
        </View>
    );
}

/** Aperçu de l'import : totaux de l'historique avant / après, lignes déjà présentes ou ignorées. */
function ImportPreviewSection({ summary, labels }: Props): React.JSX.Element {
    return (
        <View style={styles.container} testID="importPreview">
            <Text style={title2}>{labels.title}</Text>
            <View style={styles.card}>
                <PreviewRow testID="importPreviewCharges" icon="ev-station" label={labels.charges} values={summary.charges} />
                <PreviewRow testID="importPreviewEnergy" icon="bolt" label={labels.energy} values={summary.energyKwh} unit="kWh" />
                <PreviewRow testID="importPreviewTime" icon="hourglass-empty" label={labels.time} values={summary.minutes} format={formatMinutes} />
            </View>
            {labels.alreadyKnown && <Text style={styles.note} testID="importPreviewAlreadyKnown">{labels.alreadyKnown}</Text>}
            {labels.rejected && <Text style={styles.note} testID="importPreviewRejected">{labels.rejected}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacerM,
    },
    card: {
        gap: spacerL,
        padding: spacerM,
        borderWidth: 1,
        borderColor: NEUTRAL_200,
        borderRadius: spacerS,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    label: {
        textTransform: 'uppercase',
        letterSpacing: 0.24,
    },
    values: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerS,
    },
    value: {
        fontSize: 18,
    },
    after: {
        fontWeight: '600',
    },
    unit: {
        fontSize: 14,
        color: NEUTRAL_300,
    },
    badge: {
        backgroundColor: PRIMARY_COLOUR,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'black',
    },
    note: {
        fontSize: 13,
        color: NEUTRAL_300,
    },
});

export default ImportPreviewSection;
