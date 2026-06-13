/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import Main from './src/Main';
import { SafeAreaProvider } from 'react-native-safe-area-context';


function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}


export default App;
