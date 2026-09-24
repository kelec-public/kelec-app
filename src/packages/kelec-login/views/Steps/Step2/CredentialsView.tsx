import React, { useContext, RefObject, useRef } from "react";
import { findNodeHandle, NativeModules, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { capitlizeFirstLetter } from "../../../../../lib/graphics/utils";
import Account, { CarMaker } from "../../../../../lib/clients/accounts/account";
import Field, { FieldType } from "../../../../kelec-model/view/Field";
import StepLayout from "../../../../kelec-model/view/StepLayout";
import { CommonStyles } from "../../../../kelec-model/view/Styles";
import { TFA_ROUTE } from "../../../../kelec-tfa";
import { useCredentialsController } from "../../../controllers/useCredentialsController";
import { LoginEntryParamList } from "../../LoginEntryView";

type Props = NativeStackScreenProps<LoginEntryParamList, 'CredentialsView'> & {
    selectedCarMaker: CarMaker;
    setAccount: (account: Account) => void;
}

/** Étape 2 : identifiants du compte constructeur. */
const CredentialsView = ({ selectedCarMaker, setAccount, navigation }: Props) => {
    const { languageHandler } = useContext(MainContext);

    const controller = useCredentialsController({
        carMaker: selectedCarMaker,
        onLoggedIn: account => {
            setAccount(account);
            navigation.navigate("SelectACarView", { account });
        },
        onTfaRequired: regToken => navigation.navigate(TFA_ROUTE, {
            regToken,
            successMessageKey: 'youLlBeRedirectedToPreviousScreenClickNext',
        }),
    });

    // Autoremplissage Android (enregistrement des identifiants par le système)
    const { AutofillModule } = NativeModules;
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const handleFocus = (ref: RefObject<TextInput> | undefined) => {
        if (!ref?.current) return;
        const tag = findNodeHandle(ref.current);
        if (tag) AutofillModule?.notifyViewEntered(tag);
    };

    const login = async () => {
        const succeeded = await controller.submit();
        if (succeeded) AutofillModule?.commit();
        else AutofillModule?.cancel();
    };

    return (
        <StepLayout
            testID='credentialsStepView'
            title={languageHandler.getTranslation("addCar")}
            subtitle={languageHandler.getTranslation("loginWith") + " " + capitlizeFirstLetter(selectedCarMaker)}
            helpText={languageHandler.getTranslation("loginToCarMakerAccountInOrderToFetchInfo")}
            nextLabel={languageHandler.getTranslation("next")}
            isLightLoading={controller.isLoading}
            onPrevious={() => navigation.goBack()}
            onNext={() => { login(); }}
            disableNext={!controller.canSubmit}
            nextButtonTestID="loginButton"
        >
            <View style={[CommonStyles.container, CommonStyles.subView]}>
                <Field
                    ref={emailRef}
                    testID="emailInput"
                    fieldType={FieldType.Email}
                    label={languageHandler.getTranslation('email')}
                    placeholder={languageHandler.getTranslation('email')}
                    value={controller.email}
                    onFocus={handleFocus}
                    onChangeText={controller.setEmail}
                />
                <Field
                    ref={passwordRef}
                    testID="passwordInput"
                    fieldType={FieldType.Password}
                    label={languageHandler.getTranslation('password')}
                    placeholder={languageHandler.getTranslation('password')}
                    value={controller.password}
                    onFocus={handleFocus}
                    onChangeText={controller.setPassword}
                />
            </View>
        </StepLayout>
    );
};

export default CredentialsView;
