import AsyncStorage from '@react-native-async-storage/async-storage';
import * as sharedPlatformsData from './src/lib/storage/sharedPlatformsData';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock('./src/lib/model/localization/languageHandler', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        const localization = require('./src/lib/model/localization/localizations.json');
        const fr = localization["fr"];
        return {
            getAppLanguage: jest.fn().mockImplementation(() => {
                return "fr";
            }),
            loadLanguageFile: jest.fn().mockImplementation(() => {
                return fr;
            }),
            getTranslation: jest.fn().mockImplementation((key) => {
                return fr[key] || key;
            }),
            getLanguage: jest.fn().mockImplementation(() => { return "fr"; })
        };
    })
}));


jest.mock('./src/lib/clients/kelec-api/kelecApiHandler', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        return {
            getMessage: jest.fn().mockResolvedValue(null)
        }
    })
}));


jest.mock('react-native-watch-connectivity', () => {
    return {
        sendMessage: jest.fn()
    }
});


jest.mock('react-native-fs', () => {
    return {
        writeFile: jest.fn(() => Promise.resolve(true)),
        DocumentDirectoryPath: 'ExternalStorageDirectoryPath',
    };
});

jest.mock('react-native-share', () => {
    return {
        open: jest.fn()
    };
})

jest.spyOn(sharedPlatformsData, 'setNativeCryptedData').mockImplementation(
    async (key, value) => {
        await AsyncStorage.setItem(key, value);
    }
);
jest.spyOn(sharedPlatformsData, 'getNativeCryptedData').mockImplementation(
    async (key) => {
        return await AsyncStorage.getItem(key) ?? null;
    }
);
jest.spyOn(sharedPlatformsData, 'clearNativeCryptedData').mockImplementation(
    async (key) => {
        await AsyncStorage.removeItem(key);
    }
);


jest.spyOn(sharedPlatformsData, 'refreshWidget').mockImplementation(jest.fn());


jest.setTimeout(15000); 