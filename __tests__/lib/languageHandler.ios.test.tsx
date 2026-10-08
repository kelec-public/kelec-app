import LanguageHandler from "../../src/lib/model/localization/languageHandler";

jest.unmock('../../src/lib/model/localization/languageHandler');

jest.mock('react-native', () => ({
    NativeModules: {
        SettingsManager: {
            getConstants: jest.fn().mockReturnValue({
                settings: {
                    AppleLanguages: ['sv-SE'],
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
    // should be in swedish
    expect(languageHandler.getTranslation('logOut')).toBe('Logga ut');
    // should not be known
    expect(languageHandler.getTranslation('unknown')).toBe('unknown');
});