
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';

import CarsView from './CarsTab/CarsView';
import ProfileView from './ProfileTab/ProfileView';
import SettingsView from './SettingsTab/SettingsView';
import MainContext from '../../lib/Contexts/MainContext';

const Tab = createNativeBottomTabNavigator();

function Home(): React.JSX.Element {

    const { languageHandler } = useContext(MainContext);

    return (
        <NavigationContainer>
            <Tab.Navigator screenOptions={{ lazy: false }}>
                <Tab.Screen
                    name="cars"
                    component={CarsView}
                    options={{
                        title: languageHandler.getTranslation('cars'),
                        tabBarIcon: () => ({ sfSymbol: 'car.fill', androidIcon: 'directions_car' }),
                    }}
                />
                <Tab.Screen
                    name="account"
                    component={ProfileView}
                    options={{
                        title: languageHandler.getTranslation('account'),
                        tabBarIcon: () => ({ sfSymbol: 'person.fill', androidIcon: 'person' }),
                    }}
                />
                <Tab.Screen
                    name="settings"
                    component={SettingsView}
                    options={{
                        title: languageHandler.getTranslation('settings'),
                        tabBarIcon: () => ({ sfSymbol: 'gearshape.fill', androidIcon: 'settings' }),
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

export default Home;