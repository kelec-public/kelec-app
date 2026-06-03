import { StatusBarStyle, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Palette } from './_palette';

declare module '@react-navigation/native' {
  export interface Theme {
    colors: {
      // base React Navigation
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;

      //custom
      accent: string;
      primaryContainer: string;
      onPrimaryContainer: string;
      secondaryContainer: string;
      onSecondaryContainer: string;
      powerGreen: string;
    };
  }
}


const KLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Palette.gray_950, // getMainInterfaceBackground
    text: Palette.black,
    primaryContainer: Palette.white, // getGrayBackgroundColour
    onPrimaryContainer: Palette.black,
    secondaryContainer: Palette.gray_950, //getGrayWhiteBackgroundColour
    onSecondaryContainer: Palette.black,
    powerGreen: Palette.green_500, // rgb(39,205,65)
  },
  sysBar: {
    status: 'dark-content',
    navigation: 'dark-content',
  },
};

const KDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.black, // getMainInterfaceBackground
    text: Palette.white,
    primaryContainer: Palette.gray_200, // getGrayBackgroundColour
    onPrimaryContainer: Palette.white,
    secondaryContainer: Palette.gray_200, // getGrayWhiteBackgroundColour
    onSecondaryContainer: Palette.white,
    powerGreen: Palette.green_500, // rgb(39,205,65)
  },
  sysBar: {
    status: 'light-content',
    navigation: 'light-content',
  },
};

export const useAutoTheme = () => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? KDarkTheme : KLightTheme;
};
