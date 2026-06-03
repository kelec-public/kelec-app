import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../../LoginEntryView";
import LoginDefaultView from "../../../LoginDefaultView";
import { useContext, useEffect, useRef, useState } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import Text from "../../../../../../screen/Common/CustomText";
import RenaultTfaClient from "../../../../../../lib/clients/carMakers/renault/renaultTfaClient";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import { TfaEmail } from "../../../../../../lib/clients/carMakers/renault/renaultTfaModels";
import TextInput from "../../../../../../screen/Common/TextInput";

type Props = NativeStackScreenProps<LoginEntryParamList, 'TfaView'>;

enum TfaSteps {
    GETTING_DEVICE_ID = "getting_device_id",
    TFA_INIT = "tfa_init",
    GET_TFA_EMAILS = "get_tfa_emails",
    SENDING_VERIFICATION_CODE = "sending_verification_code",
    COMPLETE_VERIFICATION = "complete_verification",
    FINALIZE_TFA = "finalize_tfa"
}

enum TfaStepStatus {
    LOADING,
    DONE,
    ERROR
}

const TfaView = ({ navigation, route }: Props) => {

    const { languageHandler } = useContext(MainContext);

    const [isLightLoading, setIsLightLoading] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<TfaSteps>(TfaSteps.GETTING_DEVICE_ID);
    const [stepStatus, setStepStatus] = useState<TfaStepStatus>(TfaStepStatus.LOADING);
    const [tfaEmail, setTfaEmail] = useState<TfaEmail | null>(null);

    const [userInputCode, setUserInputCode] = useState<string>('');

    const { regToken } = route.params;
    const tfaClientRef = useRef<RenaultTfaClient | null>(null);
    if (!tfaClientRef.current) {
        tfaClientRef.current = new RenaultTfaClient(regToken);
    }

    useEffect(() => {
        launchTfaSequence();
    }, []);

    const launchTfaSequence = async () => {
        const tfaClient = tfaClientRef.current!;
        // 1ère étape on récupère le token du device
        try {
            setCurrentStep(TfaSteps.GETTING_DEVICE_ID);
            setStepStatus(TfaStepStatus.LOADING);
            const deviceId = await tfaClient.getDeviceId();
            console.log("Device ID obtained for TFA:", deviceId);
        } catch (error) {
            console.error("Error during TFA device ID retrieval:", error);
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }


        // 2ème étape on lance la séquence de TFA
        try {
            setCurrentStep(TfaSteps.TFA_INIT);
            setStepStatus(TfaStepStatus.LOADING);
            await tfaClient.initTfaSequence();
        } catch (error) {
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

        // 3ème étape on récupère les emails disponibles pour le TFA
        try {
            setCurrentStep(TfaSteps.GET_TFA_EMAILS);
            setStepStatus(TfaStepStatus.LOADING);
            const tfaEmail = await tfaClient.getTfaEmails();
            setTfaEmail(tfaEmail);
        } catch (error) {
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

        // 4ème étape on envoie le mail
        try {
            setCurrentStep(TfaSteps.SENDING_VERIFICATION_CODE);
            setStepStatus(TfaStepStatus.LOADING);
            await tfaClient.sendTfaCode();
            setStepStatus(TfaStepStatus.DONE);
        } catch (error) {
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

    };

    const onValidateCode = async () => {
        const tfaClient = tfaClientRef.current!;

        // 1ère étape on valide le code 
        try {
            setCurrentStep(TfaSteps.COMPLETE_VERIFICATION);
            setStepStatus(TfaStepStatus.LOADING);
            await tfaClient.validateTfaCode(userInputCode);
        } catch (error) {
            console.error("Error during TFA code validation:", error);
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

        // 2ème étape on finalise le flow TFA
        try {
            setCurrentStep(TfaSteps.FINALIZE_TFA);
            setStepStatus(TfaStepStatus.LOADING);
            await tfaClient.finalizeTfa();
        } catch (error) {
            console.error("Error during TFA finalization:", error);
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

        // 3ème on finalise la registration
        try {
            setCurrentStep(TfaSteps.FINALIZE_TFA);
            setStepStatus(TfaStepStatus.LOADING);
            await tfaClient.finalizeRegistration();
            setStepStatus(TfaStepStatus.DONE);
        } catch (error) {
            console.error("Error during TFA finalization:", error);
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }

        // si on est là c'est que le process est terminé
        Alert.alert(languageHandler.getTranslation('youLlBeRedirectedToPreviousScreen'));
        navigation.goBack();
    };

    return (
        <LoginDefaultView
            testID="TfaView"
            title="addCar"
            subtitle={languageHandler.getTranslation("tfaRequired")}
            isLightLoading={isLightLoading}
            onPrevious={() => {
                navigation.goBack();
            }}
            onNext={() => {
                onValidateCode();
            }}
            nextButtonTestID="tfaNextButton"
            disableNext={userInputCode.length != 6}
        >
            <View style={styles.container}>
                <Text style={commonStyles.navTitle}>{languageHandler.getTranslation("firstStep")}</Text>
                <View style={styles.stepRow}>
                    {stepStatus === TfaStepStatus.LOADING && (
                        <ActivityIndicator size="large" />
                    )}

                    <Text>{languageHandler.getTranslation(currentStep)}</Text>
                </View>
                {stepStatus === TfaStepStatus.DONE && currentStep === TfaSteps.SENDING_VERIFICATION_CODE && (
                    <TextInput
                        value={userInputCode}
                        onChangeText={setUserInputCode}
                        placeholder={languageHandler.getTranslation("enterVerificationCode")}
                        keyboardType="numeric"
                        testID="tfaCodeInput"
                    >

                    </TextInput>
                )}
                <View style={styles.stepRow}>
                    {stepStatus === TfaStepStatus.LOADING && (
                        <ActivityIndicator size="large" />
                    )}

                    <Text>{languageHandler.getTranslation(currentStep)}</Text>
                </View>
            </View>
        </LoginDefaultView>

    )
};

const styles = StyleSheet.create({
    container: {
        gap: 10,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    }
});

export default TfaView;