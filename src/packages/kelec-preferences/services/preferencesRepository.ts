import AppPreferences from "../../../lib/appPreferences/model/appPreferences";
import { saveNativePreferences } from "../../../lib/storage/sharedPlatformsData";
import { AppStorage } from "../../kelec-storage/appStorage";
import { PreferencesPatch, affectsWidgets, applyChanges } from "../models/preferencesChanges";

const KEY = 'appPreferences';

/** Préférences de l'app : stockage local, et envoi aux widgets quand ce qu'ils affichent change. */
export const PreferencesRepository = {
    async get(): Promise<AppPreferences> {
        const stored = await AppStorage.getJSON<PreferencesPatch>(KEY);
        return new AppPreferences(stored ?? undefined);
    },

    /** Applique `patch` à `current`, enregistre et renvoie les nouvelles préférences. */
    async update(current: AppPreferences, patch: PreferencesPatch): Promise<AppPreferences> {
        const next = applyChanges(current, patch);
        await AppStorage.setJSON(KEY, next);
        if (affectsWidgets(current, next)) {
            await saveNativePreferences(next);
        }
        return next;
    },
};
