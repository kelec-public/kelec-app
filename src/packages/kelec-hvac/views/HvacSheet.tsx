import { StyleSheet, View } from "react-native";
import { useContext } from "react";
import { useTheme } from "@react-navigation/native";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import BottomSheet from "../../../screen/Common/bottomSheet/BottomSheet";
import Button from '../../kelec-model/view/Button';
import TemperaturePicker from "./TemperaturePicker";
import MinSocWarning from "./MinSocWarning";
import Text from "../../../screen/Common/CustomText";
import InfoPopup from "../../../screen/Common/InfoPopup";

type Props = {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly temperature: number;
    readonly canDecrease: boolean;
    readonly canIncrease: boolean;
    readonly onDecrease: () => void;
    readonly onIncrease: () => void;
    readonly showMinSocWarning: boolean;
    readonly minimumSoc: number | null;
    readonly isLaunching: boolean;
    readonly onLaunch: () => void;
    /** Climatisation en cours et arrêt possible : avertissement « expérimental » et bouton d'arrêt sous le bouton de lancement. */
    readonly showStop: boolean;
    readonly isStopping: boolean;
    readonly onStop: () => void;
}

/** Feuille de lancement (et d'arrêt, si la climatisation tourne) du préchauffage. */
function HvacSheet(props: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const theme = useTheme();
    const isSending = props.isLaunching || props.isStopping;

    return (
        <BottomSheet
            testID="HVACModal"
            title={languageHandler.getTranslation("preHeat")}
            visible={props.visible}
            onClose={props.onClose}
        >
            <TemperaturePicker
                temperature={props.temperature}
                canDecrease={props.canDecrease}
                canIncrease={props.canIncrease}
                onDecrease={props.onDecrease}
                onIncrease={props.onIncrease}
            />
            {props.showMinSocWarning && <MinSocWarning minimumSoc={props.minimumSoc} />}

            <View style={[commonStyles.navSeparator, { marginBottom: 10 }]}></View>
            <Button
                disabled={isSending}
                testID={'confirmButton'}
                isLoading={props.isLaunching}
                onPress={props.onLaunch}
                icon={"ac-unit"}
                text={languageHandler.getTranslation("launchPreHeat")}
            />
            {props.showStop && (
                <View style={styles.stopSection}>
                    <InfoPopup
                        testID={'hvacStopExperimentalWarning'}
                        backgroundColour={'#FFCCB3'}
                        icon={"warning"}
                        iconColour={'#7A1F1F'}
                    >
                        <Text style={styles.warningText}>
                            {languageHandler.getTranslation("hvacStopExperimental")}
                        </Text>
                    </InfoPopup>
                    <Button
                        disabled={isSending}
                        testID={'stopButton'}
                        isLoading={props.isStopping}
                        onPress={props.onStop}
                        icon={"stop"}
                        buttonStyle={theme.buttons.neutral}
                        text={languageHandler.getTranslation("stopPreHeat")}
                    />
                </View>
            )}
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    stopSection: {
        marginTop: 10,
        gap: 10,
    },
    warningText: {
        color: 'black',
        flexShrink: 1,
    },
});

export default HvacSheet;
