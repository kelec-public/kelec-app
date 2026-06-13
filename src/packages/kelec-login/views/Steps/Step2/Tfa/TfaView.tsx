import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../../LoginEntryView";
import LoginDefaultView from "../../../LoginDefaultView";
import { useContext, useEffect, useRef, useState } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import Text from "../../../../../../screen/Common/CustomText";
import RenaultTfaClient, { TFA_ERRORS } from "../../../../../../lib/clients/carMakers/renault/renaultTfaClient";
import { Alert, Button, StyleSheet, View } from "react-native";
import { TfaEmail } from "../../../../../../lib/clients/carMakers/renault/renaultTfaModels";
import InfoPopup from "../../../../../../screen/Common/InfoPopup";
import FullScreenLoading from "../../../../../../FullScreenLoading";
import TfaCodeView from "./TfaCodeView";

export enum TfaOrigin {
    CAR_PAGE,
    ADD_CAR_FLOW
}

type Props = NativeStackScreenProps<LoginEntryParamList, 'TfaView'> & {
    onTfaCompleted?: () => void;
}

enum TfaStepStatus {
    LOADING,
    DONE,
    ERROR
}

const TfaView = ({ navigation, route, onTfaCompleted }: Props) => {

    const { languageHandler } = useContext(MainContext);

    const [isLightLoading, setIsLightLoading] = useState<boolean>(false);
    const [stepStatus, setStepStatus] = useState<TfaStepStatus>(TfaStepStatus.LOADING);
    const [tfaEmail, setTfaEmail] = useState<TfaEmail | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const [userInputCode, setUserInputCode] = useState<string>('');

    const { regToken, origin } = route.params;
    const tfaClientRef = useRef<RenaultTfaClient | null>(null);
    if (!tfaClientRef.current) {
        tfaClientRef.current = new RenaultTfaClient(regToken);
    }

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        launchTfaSequence();

        return (() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        })
    }, []);

    const onGoBack = () => {
        onTfaCompleted?.();
        navigation.goBack();
    };

    const launchTfaSequence = async () => {
        const tfaClient = tfaClientRef.current!;
        setStepStatus(TfaStepStatus.LOADING);

        // 1ère étape on récupère le token du device
        try {
            await tfaClient.getDeviceId();

            // 2ème étape on lance la séquence de TFA
            await tfaClient.initTfaSequence();

            // 3ème étape on récupère les emails disponibles pour le TFA
            const tfaEmail = await tfaClient.getTfaEmails();
            setTfaEmail(tfaEmail);

            // 4ème étape on envoie le mail
            await tfaClient.sendTfaCode();
            startCooldown();
            setStepStatus(TfaStepStatus.DONE);

        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }
    };

    const reSendCode = async () => {
        setUserInputCode('');
        setStepStatus(TfaStepStatus.LOADING);
        try {
            await tfaClientRef.current!.sendTfaCode();
            startCooldown();
            setStepStatus(TfaStepStatus.DONE);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
            setStepStatus(TfaStepStatus.ERROR);
            return;
        }
    };

    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const startCooldown = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setResendCooldown(10);
        intervalRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const onValidateCode = async () => {
        const tfaClient = tfaClientRef.current!;
        setIsLightLoading(true);


        try {
            // 1ère étape on valide le code 
            await tfaClient.validateTfaCode(userInputCode);

            // 2ème étape on finalise le flow TFA
            await tfaClient.finalizeTfa();

            // 3ème on finalise la registration
            await tfaClient.finalizeRegistration();

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            switch (message) {
                case TFA_ERRORS.WRONG_VERIFICATION_CODE:
                    Alert.alert(languageHandler.getTranslation('incorrectCode'));
                    break;
                case TFA_ERRORS.MAXIMUM_VERIFICATION_EXCEEDED:
                    Alert.alert(languageHandler.getTranslation('maximumAllowedTriesExceeded'));
                    onGoBack();
                    break;
                default:
                    setStepStatus(TfaStepStatus.ERROR);
                    setErrorMessage(message);
            }
            setIsLightLoading(false);
            return;
        }

        // si on est là c'est que le process est terminé
        if (origin === TfaOrigin.ADD_CAR_FLOW) {
            Alert.alert(languageHandler.getTranslation('youLlBeRedirectedToPreviousScreenClickNext'));
        } else {
            // depuis la car page
            Alert.alert(languageHandler.getTranslation('pullToRefreshCarData'));
        }

        onGoBack();
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
                return <FullScreenLoading ></FullScreenLoading>;
            case TfaStepStatus.DONE:
                return <View style={styles.stepRow}>
                    <TfaCodeView
                        email={tfaEmail?.obfuscated ?? ''}
                        onChangeCode={(code) => setUserInputCode(code)}
                    ></TfaCodeView>
                    {resendCooldown <= 1 && (
                        <Button
                            testID="resendCodeButton"
                            onPress={() => {
                                reSendCode();
                            }}
                            title={languageHandler.getTranslation('resendCode')}
                        ></Button>
                    )}

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
                onGoBack();
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
        flexDirection: 'column',
        gap: 10
    }
});

export default TfaView;