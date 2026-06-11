import { StatusBarStyle, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Palette } from './_palette';
import { typography } from './typography';
import { ButtonStyle } from './buttonStyles';
import { NavigationBarStyle } from '@zoontek/react-native-navigation-bar';
import Color from 'color';


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
        sysBar: {
            status: StatusBarStyle;
            navigation: NavigationBarStyle;
        };
        buttons: {
            primary: ButtonStyle,
            neutral: ButtonStyle,
            delete: ButtonStyle,
            donate: ButtonStyle,
        };
    }
}

const primaryButton: ButtonStyle = {
    colors: {
        background: { startColor: Palette.green_400, endColor: Palette.green_500, orientation: 'horizontal' },
        backgroundDisabled: Palette.gray_800,
        backgroundPressed: { startColor: Palette.green_400, endColor: Palette.green_700, orientation: 'horizontal' },
        text: Palette.white,
        textDisabled: Palette.gray_600,
        iconTint: Palette.white,
        loader: Palette.white,
    },
    radius: 10,
    textStyle: typography.button,
};

const whiteButton: ButtonStyle = {
    ...primaryButton,
    colors: {
        background: Palette.white,
        backgroundDisabled: Color(Palette.white).alpha(0.7).toString(),
        text: Palette.black,
        textDisabled: Palette.black,
        iconTint: Palette.black,
        loader: Palette.black,
    },
};

const redButton: ButtonStyle = {
    ...primaryButton,
    colors: {
        ...primaryButton.colors,
        background: Palette.red,
        backgroundDisabled: Color(Palette.red).alpha(0.7).toString(),
    },
};

const yellowButton: ButtonStyle = {
    ...whiteButton,
    colors: {
        ...whiteButton.colors,
        background: Palette.yellow,
        backgroundDisabled: Color(Palette.yellow).alpha(0.7).toString(),
        backgroundPressed: Color(Palette.yellow).alpha(0.8).toString(),
    },
};

const neutralButton: ButtonStyle = {
    ...whiteButton,
    colors: {
        ...whiteButton.colors,
        background: Palette.white,
        backgroundDisabled: Palette.gray_300,
        backgroundPressed: Palette.gray_950,
    },
    border: {
        color: Palette.gray_800,
        width: 1,
    },
};


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
        powerGreen: Palette.green_600, // rgb(39,205,65)
    },
    sysBar: {
        status: 'dark-content' as StatusBarStyle,
        navigation: 'dark-content' as NavigationBarStyle,
    },
    buttons: {
        primary: primaryButton,
        neutral: neutralButton,
        delete: redButton,
        donate: yellowButton,
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
        powerGreen: Palette.green_600, // rgb(39,205,65)
    },
    sysBar: {
        status: 'light-content' as StatusBarStyle,
        navigation: 'light-content' as NavigationBarStyle,
    },
    buttons: {
        primary: primaryButton,
        neutral: {
            ...neutralButton,
            border: undefined,
        },
        delete: redButton,
        donate: yellowButton,
    },
};

export const useAutoTheme = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? KDarkTheme : KLightTheme;
};
