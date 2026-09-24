import { View } from "react-native";
import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import BottomSheet from "../../../screen/Common/bottomSheet/BottomSheet";
import Button from '../../kelec-model/view/Button';
import TemperaturePicker from "./TemperaturePicker";
import MinSocWarning from "./MinSocWarning";

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
}

/** Feuille de lancement du préchauffage. */
function HvacSheet(props: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);

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
                disabled={props.isLaunching}
                testID={'confirmButton'}
                isLoading={props.isLaunching}
                onPress={props.onLaunch}
                icon={"ac-unit"}
                text={languageHandler.getTranslation("launchPreHeat")}
            />
        </BottomSheet>
    );
}

export default HvacSheet;
