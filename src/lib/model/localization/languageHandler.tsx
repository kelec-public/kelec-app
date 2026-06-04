import { NativeModules, Platform } from "react-native";
const NativeLanguage = NativeModules.NativeLanguage;

interface NestedDictionary {
    [key: string]: string | NestedDictionary;
}

const ACCEPTED_LANGUAGES: string[] = ["en", "fr", "es", "sv", "it", "de", "pt", "da", "bg", "nl", "hu", "pl", "ro", "cs", "nb", "sl", "hr", "fi", "ca"];
const DEFAULT_LANGUAGE = "en";

class LanguageHandler {
    // This class is used to handle the language of the app

    // The language of the app
    private readonly language: string;

    // The language file containing all the translations
    private readonly languageFile: { [key: string]: string };

    constructor() {
        this.language = this.getAppLanguage();
        this.languageFile = this.loadLanguageFile();
    }

    private getAppLanguage(): string {
        // Get the device language set by the user
        return Platform.OS === "ios" ? this.getiOSLanguage() : this.getAndroidLanguage();
    }

    private getiOSLanguage(): string {
        // Get the iPhone language
        const languages = NativeModules.SettingsManager.getConstants().settings.AppleLanguages;
        for (const language of languages) {
            let lang = language.substring(0, 2);
            if (ACCEPTED_LANGUAGES.includes(lang)) {
                return lang;
            }
        }
        return 'en';
    }

    private getAndroidLanguage(): string {
        // Get the language on an Android phone
        const language = NativeLanguage.getLanguage();
        const currentLanguage = language.substring(0, 2);
        return ACCEPTED_LANGUAGES.includes(currentLanguage) ? currentLanguage : DEFAULT_LANGUAGE;
    }


    private loadLanguageFile(): { [key: string]: string } {
        // Load the language file containing all the translations
        const languageFile: NestedDictionary = require('./localizations.json');
        return languageFile[this.language] as { [key: string]: string };
    }

    getTranslation(key: string): string {
        // Get the translation for the given key
        return this.languageFile[key] || key;
    }

    getLanguage(): string {
        return this.language;
    }
}

export default LanguageHandler;