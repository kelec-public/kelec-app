
import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';

import CarsView from './CarsTab/CarsView';
import ProfileView from './ProfileTab/ProfileView';
import SettingsView from './SettingsTab/SettingsView';
import MainContext from '../../lib/Contexts/MainContext';
import { Platform, useColorScheme } from 'react-native';

const Tab = createNativeBottomTabNavigator();

function Home(): React.JSX.Element {

    const { languageHandler } = useContext(MainContext);

    const isDarkMode = useColorScheme() === 'dark';
    const [androidIcons, setAnroidIcons] = useState<{
        car?: any;
        person?: any;
        settings?: any;
    }>({});

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
        const color = isDarkMode ? '#fff' : '#000';
        Promise.all([
            MaterialIcons.getImageSource('directions-car', 20, color),
            MaterialIcons.getImageSource('person', 20, color),
            MaterialIcons.getImageSource('settings', 20, color),
        ]).then(([carIcon, personIcon, settingsIcon]) => {
            setAnroidIcons({
                car: carIcon,
                person: personIcon,
                settings: settingsIcon,
            });
        });
    }, [isDarkMode]);


    return (
        <NavigationContainer>
            <Tab.Navigator screenOptions={{ lazy: false }}>
                <Tab.Screen
                    name="cars"
                    component={CarsView}
                    options={{
                        title: languageHandler.getTranslation('cars'),
                        tabBarIcon: () => Platform.OS === 'android'
                            ? androidIcons.car
                            : { sfSymbol: 'car.fill' },
                    }}
                />
                <Tab.Screen
                    name="account"
                    component={ProfileView}
                    options={{
                        title: languageHandler.getTranslation('account'),
                        tabBarIcon: () => Platform.OS === 'android'
                            ? androidIcons.person
                            : { sfSymbol: 'person.fill' },
                    }}
                />
                <Tab.Screen
                    name="settings"
                    component={SettingsView}
                    options={{
                        title: languageHandler.getTranslation('settings'),
                        tabBarIcon: () => Platform.OS === 'android'
                            ? androidIcons.settings
                            : { sfSymbol: 'gearshape.fill' },
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default Home;