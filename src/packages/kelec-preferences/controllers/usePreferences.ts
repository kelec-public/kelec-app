import { useCallback, useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { PreferencesPatch } from "../models/preferencesChanges";
import { PreferencesRepository } from "../services/preferencesRepository";

/** Préférences courantes, et mise à jour (enregistrement puis rechargement dans toute l'app). */
export function usePreferences() {
    const { appPreferences, reloadAppPreferences } = useContext(MainContext);

    const update = useCallback(async (patch: PreferencesPatch) => {
        await PreferencesRepository.update(appPreferences, patch);
        await reloadAppPreferences();
    }, [appPreferences, reloadAppPreferences]);

    return { preferences: appPreferences, update };
}
