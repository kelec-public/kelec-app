/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import Main from './src/Main';
import { ThemeProvider } from '@react-navigation/native';
import { useAutoTheme } from './theme/theme';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationBar } from '@zoontek/react-native-navigation-bar';


function App(): React.JSX.Element {
  const autoTheme = useAutoTheme();

  return (
    <ThemeProvider value={autoTheme}>
      <SafeAreaProvider>
        <NavigationBar  barStyle={autoTheme.sysBar.navigation} />
        <StatusBar barStyle={autoTheme.sysBar.status} />
        <Main />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}


export default App;
