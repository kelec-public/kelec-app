import { useContext } from "react";
import { Button, StyleSheet, View } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import Text from "../../../screen/Common/CustomText";
import InfoPopup from "../../../screen/Common/InfoPopup";
import FullScreenLoading from "../../../FullScreenLoading";
import StepLayout from "../../kelec-model/view/StepLayout";
import { TfaStepStatus, useTfaFlow } from "../controllers/useTfaFlow";
import { TfaRouteParams } from "../routes";
import TfaCodeView from "./TfaCodeView";

type Props = {
    readonly navigation: { goBack: () => void };
    readonly route: { params: TfaRouteParams };
    /** Appelé en quittant l'écran (ex. la page voiture relâche son verrou « TFA en cours »). */
    readonly onTfaCompleted?: () => void;
};

/** Écran TFA Renault, utilisé par l'ajout de voiture et par la page voiture. */
const TfaView = ({ navigation, route, onTfaCompleted }: Props) => {
    const { languageHandler } = useContext(MainContext);
    const { regToken, successMessageKey } = route.params;

    const onExit = () => {
        onTfaCompleted?.();
        navigation.goBack();
    };

    const flow = useTfaFlow({ regToken, successMessageKey, onExit });

    const renderContent = () => {
        switch (flow.status) {
            case TfaStepStatus.ERROR:
                return (
                    <InfoPopup
                        testID="TFAErrorPopUp"
                        icon={'error'}
                        backgroundColour={'#FFCCB3'}
                        iconColour={'#7A1F1F'}
                    >
                        <Text>{languageHandler.getTranslation('error')} : {flow.errorMessage}</Text>
                    </InfoPopup>
                );
            case TfaStepStatus.LOADING:
                return <FullScreenLoading />;
            case TfaStepStatus.DONE:
                return (
                    <View style={styles.stepRow}>
                        <TfaCodeView
                            email={flow.email?.obfuscated ?? ''}
                            onChangeCode={flow.setCode}
                        />
                        {flow.canResend && (
                            <Button
                                testID="resendCodeButton"
                                onPress={() => { flow.resendCode(); }}
                                title={languageHandler.getTranslation('resendCode')}
                            />
                        )}
                    </View>
                );
        }
    };

    return (
        <StepLayout
            testID="TfaView"
            title={languageHandler.getTranslation("addCar")}
            subtitle={languageHandler.getTranslation("tfaRequired")}
            nextLabel={languageHandler.getTranslation("next")}
            isLightLoading={flow.isValidating}
            onPrevious={onExit}
            onNext={() => { flow.validate(); }}
            nextButtonTestID="tfaNextButton"
            disableNext={!flow.canValidate}
        >
            <View style={styles.container}>
                {renderContent()}
            </View>
        </StepLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },
    stepRow: {
        flexDirection: 'column',
        gap: 10
    }
});

export default TfaView;
