import { Modal, useColorScheme, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import FullScreenLoading from "./FullScreenLoading";
import MainContext from "./lib/Contexts/MainContext";
import LanguageHandler from "./lib/model/localization/languageHandler";
import Home from "./screen/loggedIn/Home";
import StorageHandler from "./lib/storage/storageHandler";
import UserAccount from "./lib/clients/accounts/userAccount";
import WelcomeScreen from "./WelcomeScreen";
import { AppErrorBoundary } from "./AppErrorBoundary";
import LoginEntryView from "./packages/kelec-login/views/LoginEntryView";
import AppPreferences from "./lib/appPreferences/model/appPreferences";
import KelecApiHandler from "./lib/clients/kelec-api/kelecApiHandler";
import Text from "./screen/Common/CustomText";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";

export enum ViewsAvailable {
    LOGIN = 'LOGIN',
    LOADING = 'LOADING',
    LOGGEDIN = 'LOGGEDIN'
}

function Main(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();

    const [_, setTest] = useState<string>(''); // NOSONAR

    // if the onboarding modal should be shown
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

    // the current view of the app
    const [currentView, setCurrentView] = useState(ViewsAvailable.LOADING);

    // to current user on the app
    const [currentUser, setCurrentUser] = useState<UserAccount>(() => new UserAccount("", []));
    // to store the app preferences
    const [appPreferences, setAppPreferences] = useState<AppPreferences>(() => new AppPreferences());

    // to store message from kelec api
    const [message, setMessage] = useState<string | null>(null);

    // to handle the storage of the app
    const storageHandler = useRef(new StorageHandler()).current;

    // to handle the language of the app
    const languageHandler = useRef(new LanguageHandler()).current;

    // to handle kelec api
    const kelecApiHandler = useRef(new KelecApiHandler()).current;


    useEffect(() => {
        checkForMessages();
        checkOnboarding();
        reloadUser();
        reloadAppPreferences();
    }, []);

    // to check if user has already seen the onboarding
    const checkOnboarding = async (): Promise<void> => {
        const hasSeenOnboarding = await storageHandler.getHasSeenOnboarding();
        setShowOnboarding(!hasSeenOnboarding);
    }

    // to reload the user from the storage and update the current view
    const reloadUser = async (): Promise<void> => {

        let user = await storageHandler.loadAccount();
        if (user) {
            setCurrentUser(user);
            setCurrentView(ViewsAvailable.LOGGEDIN);
            setTest(''); // IF REMOVED ALL TESTS WILL FAIL (like why ??)
            return;
        }
        setCurrentUser(new UserAccount("", []));
        setCurrentView(ViewsAvailable.LOGIN);


    };

    // to reload the app preferences from the storage
    const reloadAppPreferences = async (): Promise<void> => {
        const preferences = await storageHandler.getAppPreferences();

        if (preferences) {
            setAppPreferences(preferences);
        }
    };

    // to check if there is a message to display
    const pkg = require('../package.json');
    const checkForMessages = async (): Promise<void> => {
        const message = await kelecApiHandler.getMessage(pkg.version, languageHandler.getLanguage());
        if (message) {
            setMessage(message);
        }
    };


    // to get the current view of the app according to the current state
    const getCurrentView = (): React.JSX.Element => {
        switch (currentView) {
            case ViewsAvailable.LOGIN:
                return <LoginEntryView />;
            case ViewsAvailable.LOGGEDIN:
                return <Home />;
            case ViewsAvailable.LOADING:
                return <FullScreenLoading />;
        }
        ;
    };

    // the values of the main context used by the children props
    const mainContextValues = useMemo(() => ({
        languageHandler,
        currentUser,
        reloadUser,
        storageHandler,
        appPreferences,
        reloadAppPreferences,
        checkOnboarding,
        setCurrentView
    }), [languageHandler, currentUser, reloadUser, storageHandler, appPreferences, reloadAppPreferences, showOnboarding]);

    return (
        <AppErrorBoundary>
            <MainContext.Provider value={mainContextValues}>
                <Modal
                    visible={!!message}
                    animationType='fade'
                    transparent
                    onRequestClose={() => {
                    }}
                >
                    <SafeAreaProvider>
                        <View
                            testID="messageView"
                            style={{
                                flex: 1,
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <View style={{
                                backgroundColor: theme.colors.background,
                                padding: 20,
                                borderRadius: 10
                            }}>
                                <Text>{message}</Text>
                            </View>
                        </View>
                    </SafeAreaProvider>
                </Modal>
                <Modal visible={showOnboarding} animationType='slide'>
                    <SafeAreaProvider>
                        <WelcomeScreen />
                    </SafeAreaProvider>
                </Modal>
                <View testID='appView' style={{ flex: 1, backgroundColor: theme.colors.background }}>
                    {getCurrentView()}
                </View>
            </MainContext.Provider>
        </AppErrorBoundary>
    );
}


export default Main;