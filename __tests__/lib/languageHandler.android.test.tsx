import LanguageHandler from "../../src/lib/model/localization/languageHandler";

jest.unmock('../../src/lib/model/localization/languageHandler');

const mockGetLanguage = jest.fn();


jest.mock('react-native', () => ({
    NativeModules: {
        SettingsManager: {
            getConstants: jest.fn().mockReturnValue({
                settings: {
                    AppleLanguages: ['sv-SE'],
                },
            }),
        },
        NativeLanguage: {
            getLanguage: jest.fn().mockImplementation(() => mockGetLanguage()),
        }
    },
    Platform: {
        OS: 'android',
        select: jest.fn(),
    },
}));


test('should test languageHandler', async () => {
    mockGetLanguage.mockReturnValueOnce('sv-SE');
    const languageHandler = new LanguageHandler();
    // should be in swedish
    expect(languageHandler.getTranslation('logOut')).toBe('Logga ut');
});

test('should test languageHandler with english', async () => {
    mockGetLanguage.mockReturnValueOnce('ab-AB');
    const languageHandler = new LanguageHandler();
    // should be in english
    expect(languageHandler.getTranslation('logOut')).toBe('Log out');
});