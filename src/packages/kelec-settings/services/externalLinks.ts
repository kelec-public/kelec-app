import { Linking } from "react-native";

export const ExternalLinks = {
    FEEDBACK: 'mailto:contact@kelec.app?subject=Kelec Feedback',
    TRANSLATE: 'https://translate.kelec.app',
    DISCORD: 'https://discord.gg/ntJayVBYGV',
    AUTHOR_LINKEDIN: 'https://www.linkedin.com/in/kelyan-pegeotselme/',
} as const;

export const openExternalLink = (url: string): void => {
    Linking.openURL(url);
};
