import { Modal, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
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

export enum ViewsAvailable {
    LOGIN = 'LOGIN',
    LOADING = 'LOADING',
    LOGGEDIN = 'LOGGEDIN'
}

function Main(): React.JSX.Element {
    const [_, setTest] = useState<string>(''); // NOSONAR

    // if the onboarding modal should be shown
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

    // the current view of the app
    const [currentView, setCurrentView] = useState(ViewsAvailable.LOADING);

    // to current user on the app
    const [currentUser, setCurrentUser] = useState<UserAccount>(new UserAccount("", []));
    // to store the app preferences
    const [appPreferences, setAppPreferences] = useState<AppPreferences>(new AppPreferences());

    // to handle the storage of the app
    const storageHandler = new StorageHandler();

    // to handle the language of the app
    const languageHandler = new LanguageHandler();



    useEffect(() => {
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



    // to get the current view of the app according to the current state
    const getCurrentView = (): React.JSX.Element => {
        switch (currentView) {
            case ViewsAvailable.LOGIN:
                return <LoginEntryView />;
            case ViewsAvailable.LOGGEDIN:
                return <Home />;
            case ViewsAvailable.LOADING:
                return <FullScreenLoading />;
        };
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
                <Modal visible={showOnboarding} animationType='slide'>
                    <WelcomeScreen />
                </Modal>
                <View testID='appView' style={{ flex: 1 }} >
                    {getCurrentView()}
                </View>
            </MainContext.Provider>
        </AppErrorBoundary>
    );
}


export default Main;