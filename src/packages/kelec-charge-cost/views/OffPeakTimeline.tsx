import { StyleSheet, useColorScheme, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { NEUTRAL_100, NEUTRAL_300, NEUTRAL_450, PRIMARY_COLOUR } from "../../kelec-model/lib/colours";
import { spacerS } from "../../kelec-model/view/Spacers";
import { subTitle3 } from "../../kelec-model/view/Titles";
import { OffPeakSlot } from "../models/Tariff";
import { offPeakRanges } from "../services/offPeakSummary";

const DAY_MINUTES = 24 * 60;
const HOURS = ['00h', '06h', '12h', '18h', '24h'];

/** Journée de 00h à 24h, plages d'heures creuses en vert (une plage qui passe minuit apparaît aux deux bouts). */
function OffPeakTimeline({ slots }: { readonly slots: OffPeakSlot[] }): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <View testID="offPeakTimeline" style={styles.container}>
            <View style={[styles.bar, { backgroundColor: isDarkMode ? NEUTRAL_450 : NEUTRAL_100 }]}>
                {offPeakRanges(slots).map(([start, end]) => (
                    <View
                        key={`${start}-${end}`}
                        style={[styles.range, { left: `${start / DAY_MINUTES * 100}%`, width: `${(end - start) / DAY_MINUTES * 100}%` }]}
                    />
                ))}
            </View>
            <View style={styles.hours}>
                {HOURS.map(hour => <Text key={hour} style={[subTitle3, { color: NEUTRAL_300 }]}>{hour}</Text>)}
            </View>
        </View>
    );
}

const BAR_HEIGHT = 12;

const styles = StyleSheet.create({
    container: {
        gap: spacerS,
    },
    bar: {
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        overflow: 'hidden',
    },
    range: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: PRIMARY_COLOUR,
    },
    hours: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default OffPeakTimeline;
