
import React, { useContext } from 'react';
import { NavigationContainer, useTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CarsView from './CarsTab/CarsView';
import ProfileView from './ProfileTab/ProfileView';
import SettingsView from './SettingsTab/SettingsView';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from '../../lib/Contexts/MainContext';
import { getGrayBackgroundColour } from '../../lib/graphics/utils';
import { useColorScheme } from 'react-native';

function Home(): React.JSX.Element {

    // language handler from context
    const { languageHandler } = useContext(MainContext);

    // get theme
    const isDarkMode = useColorScheme() === 'dark';

    // create the bottom tab navigator
    const Tab = createBottomTabNavigator();

    const getTabBarIcon = (route: string, focused: boolean, color: string, size: number) => {
        let iconName;
        switch (route) {
            case languageHandler.getTranslation('cars'):
                iconName = 'directions-car'
                break;
            case languageHandler.getTranslation('account'):
                iconName = 'person'
                break;
            default:
                iconName = 'settings';
        }

        // You can return any component that you like here!
        return <Icon testID={'bottomButton' + iconName} name={iconName} size={size} color={color} />;
    }

    return (
        <NavigationContainer theme={useTheme()}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route.name, focused, color, size),
                    tabBarActiveTintColor: 'rgb(0, 122, 255)',
                    tabBarInactiveTintColor: 'gray',
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: getGrayBackgroundColour(isDarkMode),
                        shadowOffset: {
                            width: 0,
                            height: 12,
                        },
                        borderWidth: 0,
                        shadowOpacity: 0.58,
                        shadowRadius: 16.0,
                        elevation: 24,
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                        borderTopWidth: 0,
                        bottom: 0,
                        padding: 10,
                        width: '100%',
                        zIndex: 0,
                    },

                })}
            >

                <Tab.Screen name={languageHandler.getTranslation('cars')} component={CarsView} />
                <Tab.Screen name={languageHandler.getTranslation('account')} component={ProfileView} />
                <Tab.Screen name={languageHandler.getTranslation('settings')} component={SettingsView} />
            </Tab.Navigator>
        </NavigationContainer >
    );
}

export default Home;