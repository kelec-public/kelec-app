import LanguageHandler from "../../src/lib/model/localization/languageHandler";

jest.unmock('../../src/lib/model/localization/languageHandler');

jest.mock('react-native', () => ({
    NativeModules: {
        SettingsManager: {
            getConstants: jest.fn().mockReturnValue({
                settings: {
                    AppleLanguages: ['ab-AB'],
                },
            }),
        },
    },
    Platform: {
        OS: 'ios', // or 'ios'
        select: jest.fn(),
    },
}));

test('should test languageHandler', async () => {
    const languageHandler = new LanguageHandler();
    // should be in english
    expect(languageHandler.getTranslation('logOut')).toBe('Log out');
});