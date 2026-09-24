import AsyncStorage from "@react-native-async-storage/async-storage";
import AppPreferences from "../../../src/lib/appPreferences/model/appPreferences";
import * as sharedPlatformsData from "../../../src/lib/storage/sharedPlatformsData";
import { PreferencesRepository } from "../../../src/packages/kelec-preferences";

let saveNativePreferences: jest.SpyInstance;

beforeEach(async () => {
    await AsyncStorage.clear();
    saveNativePreferences = jest.spyOn(sharedPlatformsData, 'saveNativePreferences').mockResolvedValue();
});

afterEach(() => {
    jest.restoreAllMocks();
});

test('valeurs par défaut quand rien n\'est enregistré', async () => {
    expect(await PreferencesRepository.get()).toEqual(new AppPreferences());
});

test('update renvoie une copie, enregistre et ne modifie pas les préférences courantes', async () => {
    const current = new AppPreferences();
    const next = await PreferencesRepository.update(current, { hideMap: true });

    expect(next).not.toBe(current);
    expect(current.hideMap).toBe(false);
    expect(next.hideMap).toBe(true);
    expect((await PreferencesRepository.get()).hideMap).toBe(true);
});

test('les widgets ne sont mis à jour que si les unités changent', async () => {
    const current = new AppPreferences();

    await PreferencesRepository.update(current, { mergeCharges: true });
    expect(saveNativePreferences).not.toHaveBeenCalled();

    const withMiles = await PreferencesRepository.update(current, { displayMiles: true });
    expect(saveNativePreferences).toHaveBeenCalledWith(withMiles);
});

test('désactiver les miles désactive aussi la conversion', async () => {
    const current = new AppPreferences({ displayMiles: true, convertToMiles: true });
    const next = await PreferencesRepository.update(current, { displayMiles: false });

    expect(next.convertToMiles).toBe(false);
    expect(saveNativePreferences).toHaveBeenCalledTimes(1);
});
