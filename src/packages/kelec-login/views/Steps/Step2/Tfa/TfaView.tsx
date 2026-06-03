import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../../LoginEntryView";
import LoginDefaultView from "../../../LoginDefaultView";
import { useContext, useEffect, useRef, useState } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import Text from "../../../../../../screen/Common/CustomText";
import RenaultTfaClient from "../../../../../../lib/clients/carMakers/renault/renaultTfaClient";
import { Alert, StyleSheet, View } from "react-native";
import { TfaEmail } from "../../../../../../lib/clients/carMakers/renault/renaultTfaModels";
import TextInput from "../../../../../../screen/Common/TextInput";
import InfoPopup from "../../../../../../screen/Common/InfoPopup";
import FullScreenLoading from "../../../../../../FullScreenLoading";
import TfaCodeView from "./TfaCodeView";

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
    //const [currentStep, setCurrentStep] = useState<TfaSteps>(TfaSteps.GETTING_DEVICE_ID);
    const [stepStatus, setStepStatus] = useState<TfaStepStatus>(TfaStepStatus.LOADING);
    const [tfaEmail, setTfaEmail] = useState<TfaEmail | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

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
        setStepStatus(TfaStepStatus.LOADING);

        // 1ère étape on récupère le token du device
        try {
            //setCurrentStep(TfaSteps.GETTING_DEVICE_ID);
            await tfaClient.getDeviceId();

            // 2ème étape on lance la séquence de TFA
            //setCurrentStep(TfaSteps.TFA_INIT);
            await tfaClient.initTfaSequence();

            // 3ème étape on récupère les emails disponibles pour le TFA
            //setCurrentStep(TfaSteps.GET_TFA_EMAILS);
            const tfaEmail = await tfaClient.getTfaEmails();
            setTfaEmail(tfaEmail);

            // 4ème étape on envoie le mail
            //setCurrentStep(TfaSteps.SENDING_VERIFICATION_CODE);
            await tfaClient.sendTfaCode();
            setStepStatus(TfaStepStatus.DONE);

        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }
    };

    const onValidateCode = async () => {
        const tfaClient = tfaClientRef.current!;
        setIsLightLoading(true);


        try {
            // 1ère étape on valide le code 
            //setCurrentStep(TfaSteps.COMPLETE_VERIFICATION);
            await tfaClient.validateTfaCode(userInputCode);

            // 2ème étape on finalise le flow TFA
            //setCurrentStep(TfaSteps.FINALIZE_TFA);
            await tfaClient.finalizeTfa();

            // 3ème on finalise la registration
            //setCurrentStep(TfaSteps.FINALIZE_TFA);
            await tfaClient.finalizeRegistration();

        } catch (error) {
            setStepStatus(TfaStepStatus.ERROR);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
            return;
        }

        // si on est là c'est que le process est terminé
        Alert.alert(languageHandler.getTranslation('youLlBeRedirectedToPreviousScreen'));
        navigation.goBack();
    };

    const getViewDisplay = () => {
        switch (stepStatus) {
            case TfaStepStatus.ERROR:
                return <InfoPopup
                    testID="TFAErrorPopUp"
                    icon={'error'}
                    backgroundColour={'#FFCCB3'}
                    iconColour={'#7A1F1F'}
                >
                    <Text>{languageHandler.getTranslation('error')} : {errorMessage}</Text>
                </InfoPopup>;
            case TfaStepStatus.LOADING:
                return <View style={styles.stepRow}>
                    <FullScreenLoading ></FullScreenLoading>
                </View>;
            case TfaStepStatus.DONE:
                return <View style={styles.stepRow}>
                    <TfaCodeView
                        email={tfaEmail?.obfuscated ?? ''}
                        onChangeCode={(code) => setUserInputCode(code)}
                    ></TfaCodeView>
                </View>;
        }
    }

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
                {getViewDisplay()}
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