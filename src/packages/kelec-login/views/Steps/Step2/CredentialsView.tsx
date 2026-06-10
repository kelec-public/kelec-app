import React, { useContext, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import { capitlizeFirstLetter } from "../../../../../lib/graphics/utils";
import Field from "../../../../kelec-model/view/Field";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../LoginEntryView";
import DemoAccount from "../../../../../lib/clients/accounts/demoAccount";
import Account, { CarMaker } from "../../../../../lib/clients/accounts/account";
import HyundaiClient from "../../../../../lib/clients/carMakers/hyundaiClient";
import HyundaiAccount from "../../../../../lib/clients/accounts/hyundaiAccount";
import RenaultClient from "../../../../../lib/clients/carMakers/renaultClient";
import RenaultAccount from "../../../../../lib/clients/accounts/renaultAccount";
import { CarMakerClientErrors } from "../../../../../lib/clients/carMakers/carMakerClient";
import LoginDefaultView from "../../LoginDefaultView";
import { CommonStyles } from "../../../../kelec-model/view/Styles";
import { TfaOrigin } from "./Tfa/TfaView";

type Props = NativeStackScreenProps<LoginEntryParamList, 'CredentialsView'> & {
    selectedCarMaker: CarMaker;
    setAccount: (account: Account) => void;
}
const CredentialsView = (props: Props) => {
    const { selectedCarMaker, setAccount, navigation } = props
    const { languageHandler } = useContext(MainContext);

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isLightLoading, setIsLightLoading] = useState<boolean>(false);
    // login 
    const handleLogin = async () => {
        setIsLightLoading(true);

        // check for demo mode
        if (email.toLowerCase() === "kelec-demo@gmail.com" && password.toLowerCase() === "demo") {
            const demoAccount = new DemoAccount("demo", "demo", CarMaker.DEMO);
            loginUser(demoAccount);
            return;
        };


        switch (selectedCarMaker) {
            case CarMaker.RENAULT:
            case CarMaker.DACIA:
            case CarMaker.ALPINE: {
                await loginRenaultGroup();
                break;
            }
            case CarMaker.HYUNDAI: {
                await loginHyundai();
                break;
            }

        }

        setIsLightLoading(false);
    };


    /**
     * 
     * @param account account logged in
     */
    const loginUser = (account: Account) => {
        setAccount(account);
        setIsLightLoading(false);
        navigation.navigate("SelectACarView", {
            account: account
        });
    };

    /**
     * Handle Hyundai login
     */
    const loginHyundai = async () => {
        const client = new HyundaiClient(email.toLowerCase(), password, '8056');
        // first check if the user is among the people authorised to use the app
        const authorisedLogin = await client.checkAuthorised();
        if (!authorisedLogin) {
            Alert.alert(
                languageHandler.getTranslation('error'),
                languageHandler.getTranslation("Not yet available"),
                [
                    { text: languageHandler.getTranslation('ok') }
                ]);
            return;
        }

        // then check that the user has entered valid credentials
        const canLogin = await client.checkLogin();
        if (canLogin) {
            const hyundaiAccount = new HyundaiAccount(email.toLowerCase(), password, '8056');
            loginUser(hyundaiAccount);
        } else {
            Alert.alert(
                languageHandler.getTranslation('error'),
                languageHandler.getTranslation('invalidPassWord'),
                [
                    { text: languageHandler.getTranslation('ok') }
                ]);
        }

    };

    /** 
     * Handle Renault group login
     */
    const loginRenaultGroup = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        const client = new RenaultClient(trimmedEmail, password);
        const kamereonAccountID = await client.getKamereonAccount(selectedCarMaker);
        if (kamereonAccountID.canLogin) {
            const renaultAccount = new RenaultAccount(trimmedEmail, password, kamereonAccountID.kamereonAccountID ?? '', undefined, kamereonAccountID.firstName, kamereonAccountID.lastName, selectedCarMaker);
            loginUser(renaultAccount);
            return;
        }

        let errorMessage = "";
        switch (kamereonAccountID.errorMessage) {
            case CarMakerClientErrors.SERVER_ERROR:
                errorMessage = languageHandler.getTranslation('serverError');
                break;
            case CarMakerClientErrors.ACCOUNT_LOCKED:
                errorMessage = languageHandler.getTranslation('accountLocked');
                break;
            case CarMakerClientErrors.INVALID_CREDENTIALS:
                errorMessage = languageHandler.getTranslation('invalidPassWord');
                break;
            case CarMakerClientErrors.PENDING_TFA:
                // redirect to tfa view
                navigation.navigate("TfaView", {
                    regToken: kamereonAccountID.regToken ?? '',
                    origin: TfaOrigin.ADD_CAR_FLOW,
                });
                return; // pas besoin d'afficher l'erreur
        }

        Alert.alert(
            languageHandler.getTranslation('error'),
            errorMessage,
            [
                { text: languageHandler.getTranslation('ok') }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={CommonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LoginDefaultView
                testID='credentialsStepView'
                title="addCar"
                subtitle={languageHandler.getTranslation("loginWith") + " " + capitlizeFirstLetter(selectedCarMaker)}
                helpText="loginToCarMakerAccountInOrderToFetchInfo"
                isLightLoading={isLightLoading}
                onPrevious={() => {
                    navigation.goBack();
                }}
                onNext={() => {
                    handleLogin();
                }}
                disableNext={email.length === 0 || password.length === 0}
                nextButtonTestID="loginButton"
            >
                <View
                    style={
                        [
                            CommonStyles.container,
                            CommonStyles.subView,
                        ]
                    }
                >
                    <Field
                        testID="emailInput"
                        label={languageHandler.getTranslation("email")}
                        placeholder={languageHandler.getTranslation("email")}
                        value={email}
                        onChangeText={setEmail}
                    />
                    <Field
                        testID="passwordInput"
                        label={languageHandler.getTranslation("password")}
                        placeholder={languageHandler.getTranslation("password")}
                        value={password}
                        onChangeText={setPassword}
                        isPrivate={true}
                    />

                </View>
            </LoginDefaultView>
        </KeyboardAvoidingView >
    );
};

export default CredentialsView;