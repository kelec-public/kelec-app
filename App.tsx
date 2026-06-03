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


function App(): React.JSX.Element {
  const autoTheme = useAutoTheme();

  return (
    <ThemeProvider value={autoTheme}>
        <Main />
    </ThemeProvider>
  );
}


export default App;
