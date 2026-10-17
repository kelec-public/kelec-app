import React, { useContext } from 'react';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createNativeBottomTabNavigator, NativeBottomTabIcon } from '@react-navigation/bottom-tabs/unstable';
import CarsView from './CarsTab/CarsView';
import ProfileView from '../../packages/kelec-profile/views/ProfileView';
import SettingsView from '../../packages/kelec-settings/views/SettingsView';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from '../../lib/Contexts/MainContext';
import { getGrayBackgroundColour } from '../../lib/graphics/utils';
import { Platform, useColorScheme } from 'react-native';

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
 * Onglets natifs (react-native-screens) : liquid glass sur iOS 26+, barre iOS classique avant,
 * barre Material sur Android.
 */
function Home(): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const isDarkMode = useColorScheme() === 'dark';

    const Tab = createNativeBottomTabNavigator();

    return (
        <NavigationContainer theme={useTheme()}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: 'rgb(0, 122, 255)',
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                    // comme l'ancienne barre JS : un onglet n'est monté qu'à sa première ouverture
                    lazy: true,
                    // sur iOS, un fond masquerait le verre (ou le flou système)
                    tabBarStyle: Platform.OS === 'android' ? { backgroundColor: getGrayBackgroundColour(isDarkMode) } : undefined,
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
    );
}

export default Home;
