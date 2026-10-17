import React, { useContext, useMemo, useState } from 'react';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createNativeBottomTabNavigator, NativeBottomTabIcon, NativeBottomTabNavigationOptions } from '@react-navigation/bottom-tabs/unstable';
import CarsView from './CarsTab/CarsView';
import ProfileView from '../../packages/kelec-profile/views/ProfileView';
import SettingsNavigator from '../../packages/kelec-settings/views/SettingsNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from '../../lib/Contexts/MainContext';
import TabBarContext from '../../lib/Contexts/TabBarContext';
import { getGrayBackgroundColour } from '../../lib/graphics/utils';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView as TabsSafeAreaView } from 'react-native-screens/experimental';

type SFSymbolName = Extract<NativeBottomTabIcon, { type: 'sfSymbol' }>['name'];
/** Icône d'un onglet : SF Symbol sur iOS, icône MaterialIcons en image sur Android. */
type TabIcon = { readonly sfSymbol: SFSymbolName; readonly material: string };

const TAB_ICON_SIZE = 24;

const CARS_ICON: TabIcon = { sfSymbol: 'car.fill', material: 'directions-car' };
const ACCOUNT_ICON: TabIcon = { sfSymbol: 'person.fill', material: 'person' };
const SETTINGS_ICON: TabIcon = { sfSymbol: 'gearshape.fill', material: 'settings' };

const getTabBarIcon = (icon: TabIcon): NativeBottomTabIcon =>
    Platform.OS === 'ios'
        ? { type: 'sfSymbol', name: icon.sfSymbol }
        : { type: 'image', source: Icon.getImageSourceSync(icon.material, TAB_ICON_SIZE) };

/**
 * Contenu d'un onglet.
 * - Un fournisseur de marges par onglet : sa vue est dans l'écran natif de l'onglet. Sur iOS, ses marges
 *   du bas comprennent donc la barre d'onglets, flottante par-dessus le contenu.
 * - Android : la barre Material est aussi posée par-dessus le contenu, mais n'entre pas dans les marges ;
 *   la SafeAreaView de react-native-screens (`interface`) réserve sa hauteur (0 quand elle est masquée).
 */
const TabScreenLayout = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
    const content = <SafeAreaProvider>{children}</SafeAreaProvider>;
    if (Platform.OS !== 'android') return content;
    return (
        <TabsSafeAreaView edges={{ bottom: true }} insetType="interface" style={styles.flex}>
            {content}
        </TabsSafeAreaView>
    );
};

/** Masquée par un écran à étapes (TabBarContext) ; fond gris sur Android, aucun sur iOS (il cacherait le verre). */
const getTabBarStyle = (isHidden: boolean, isDarkMode: boolean): NativeBottomTabNavigationOptions['tabBarStyle'] => {
    if (isHidden) return { display: 'none' };
    if (Platform.OS === 'android') return { backgroundColor: getGrayBackgroundColour(isDarkMode) };
    return undefined;
};

// hors du composant : recréé à chaque rendu, le navigateur remonterait tous les onglets
const Tab = createNativeBottomTabNavigator();

/**
 * Onglets natifs (react-native-screens) : liquid glass sur iOS 26+, barre iOS classique avant,
 * barre Material sur Android.
 */
function Home(): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const isDarkMode = useColorScheme() === 'dark';
    const [isTabBarHidden, setTabBarHidden] = useState(false);
    const tabBarContextValue = useMemo(() => ({ setTabBarHidden }), []);

    return (
        <TabBarContext.Provider value={tabBarContextValue}>
            <NavigationContainer theme={useTheme()}>
                <Tab.Navigator
                    screenLayout={TabScreenLayout}
                    screenOptions={{
                        tabBarActiveTintColor: 'rgb(0, 122, 255)',
                        tabBarInactiveTintColor: 'gray',
                        headerShown: false,
                        // comme l'ancienne barre JS : un onglet n'est monté qu'à sa première ouverture
                        lazy: true,
                        tabBarStyle: getTabBarStyle(isTabBarHidden, isDarkMode),
                    }}
                >
                    <Tab.Screen
                        name={languageHandler.getTranslation('cars')}
                        component={CarsView}
                        options={{ tabBarIcon: getTabBarIcon(CARS_ICON) }}
                    />
                    <Tab.Screen
                        name={languageHandler.getTranslation('account')}
                        component={ProfileView}
                        options={{ tabBarIcon: getTabBarIcon(ACCOUNT_ICON) }}
                    />
                    <Tab.Screen
                        name={languageHandler.getTranslation('settings')}
                        component={SettingsNavigator}
                        options={{ tabBarIcon: getTabBarIcon(SETTINGS_ICON) }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </TabBarContext.Provider>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});

export default Home;
