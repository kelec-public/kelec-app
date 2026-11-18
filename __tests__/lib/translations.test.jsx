// the main purpose of this test is to check that all languages have the same keys
const languages = require('../../src/lib/model/localization/localizations.json');

const spacesBefore = (value) => (value.match(/^ +/) || [''])[0].length;
const spacesAfter = (value) => (value.match(/ +$/) || [''])[0].length;
const lineBreaks = (value) => (value.match(/\r?\n/g) || []).length;

test('all languages have the same keys', () => {
    const keys = Object.keys(languages.en);
    Object.keys(languages).forEach((lang) => {
        expect(Object.keys(languages[lang])).toEqual(keys);
    });
});

test.each(Object.keys(languages))('%s has the same spaces and line breaks as en', (lang) => {
    // each translation must have the same number of spaces before and after, and the same number of line breaks
    const mismatches = [];
    Object.entries(languages[lang]).forEach(([key, value]) => {
        const enValue = languages.en[key];
        if (!enValue || value === "") {
            return;
        }
        const checks = {
            spacesBefore: [spacesBefore(value), spacesBefore(enValue)],
            spacesAfter: [spacesAfter(value), spacesAfter(enValue)],
            lineBreaks: [lineBreaks(value), lineBreaks(enValue)],
        };
        Object.entries(checks).forEach(([check, [actual, expected]]) => {
            if (actual !== expected) {
                mismatches.push(`${lang}.${key}: ${check} ${actual} (en: ${expected}) ${JSON.stringify(value)}`);
            }
        });
    });
    expect(mismatches).toEqual([]);
});
