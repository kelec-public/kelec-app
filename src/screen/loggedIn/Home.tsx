import React, { useContext, useMemo, useState } from 'react';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createNativeBottomTabNavigator, NativeBottomTabIcon } from '@react-navigation/bottom-tabs/unstable';
import CarsView from './CarsTab/CarsView';
import ProfileView from '../../packages/kelec-profile/views/ProfileView';
import SettingsView from '../../packages/kelec-settings/views/SettingsView';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from '../../lib/Contexts/MainContext';
import TabBarContext from '../../lib/Contexts/TabBarContext';
import { getGrayBackgroundColour } from '../../lib/graphics/utils';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
                    // un fournisseur de marges par onglet : sa vue est dans l'écran natif de l'onglet, ses marges
                    // du bas comprennent donc la barre d'onglets (iOS : barre flottante par-dessus le contenu)
                    screenLayout={({ children }) => <SafeAreaProvider>{children}</SafeAreaProvider>}
                    screenOptions={{
                        tabBarActiveTintColor: 'rgb(0, 122, 255)',
                        tabBarInactiveTintColor: 'gray',
                        headerShown: false,
                        // comme l'ancienne barre JS : un onglet n'est monté qu'à sa première ouverture
                        lazy: true,
                        // masquée par un écran à étapes (TabBarContext) ; sur iOS, un fond cacherait le verre
                        tabBarStyle: isTabBarHidden
                            ? { display: 'none' }
                            : Platform.OS === 'android' ? { backgroundColor: getGrayBackgroundColour(isDarkMode) } : undefined,
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
                        component={SettingsView}
                        options={{ tabBarIcon: getTabBarIcon(SETTINGS_ICON) }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </TabBarContext.Provider>
    );
}

export default Home;
