// API publique de kelec-preferences : préférences de l'app, partagées par toutes les features.
export { PreferencesRepository } from "./services/preferencesRepository";
export { usePreferences } from "./controllers/usePreferences";
export type { BooleanPreference, PreferencesPatch } from "./models/preferencesChanges";
