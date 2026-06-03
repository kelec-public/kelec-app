import { View, StyleSheet } from "react-native";
import Text from "./screen/Common/CustomText";
import { useContext } from "react";
import MainContext from "./lib/Contexts/MainContext";

const getErrorMessage = (message: string) => {
    switch (message) {
        case "account_locked":
            return "accountLocked";
        case "invalid_credentials":
            return "invalidCredentials";
        case "err.func.not.connected":
            return "unauthorizedCarRequest";
        case "err.func.wired.overloaded":
            return "tooManyRequests";
        case "err.func.privacy.on":
        case "err.func.wired.lkcd-authorization.failure":
            return "privacyModeOn";
        case "err.func.wired.notFound":
            return "dataNotYetAvailable";
        case "pending_tfa":
            return "pendingTFA";
        default:
            return message;
    }
};
interface FullScreenErrorProps {
    readonly message: string;
}



function FullScreenError({ message }: FullScreenErrorProps): React.JSX.Element {



    const { languageHandler } = useContext(MainContext);
    return <View testID="errorView" style={[styles.loadingSafeArea]} >

        <Text testID="errorMessage" style={{ fontSize: 15, textAlign: 'center' }}>{languageHandler.getTranslation(getErrorMessage(message))}</Text>

    </View>
}

const styles = StyleSheet.create({
    loadingSafeArea: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        gap: 15
    }
});

export default FullScreenError;
export { getErrorMessage };