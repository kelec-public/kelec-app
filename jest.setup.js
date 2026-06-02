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
            getMappedLanguage: jest.fn().mockImplementation(() => {
                return "fr-FR";
            }),
        };
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

jest.spyOn(sharedPlatformsData, 'refreshWidget').mockImplementation(jest.fn());


jest.setTimeout(15000); 