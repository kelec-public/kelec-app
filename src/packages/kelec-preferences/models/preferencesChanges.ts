import AppPreferences from "../../../lib/appPreferences/model/appPreferences";

export type PreferencesPatch = Partial<Omit<AppPreferences, 'distanceUnits'>>;

/** Préférences lues par les widgets natifs de l'écran d'accueil (iOS et Android). */
const WIDGET_FIELDS: (keyof PreferencesPatch)[] = ['displayMiles', 'convertToMiles'];

/** Nouvelles préférences (copie) avec les changements appliqués et les dépendances respectées. */
export const applyChanges = (current: AppPreferences, patch: PreferencesPatch): AppPreferences => {
    const next = new AppPreferences({ ...current, ...patch });
    // la conversion en miles n'a de sens que si les miles sont affichés
    if (!next.displayMiles) next.convertToMiles = false;
    return next;
};

export const affectsWidgets = (before: AppPreferences, after: AppPreferences): boolean =>
    WIDGET_FIELDS.some(field => before[field] !== after[field]);
