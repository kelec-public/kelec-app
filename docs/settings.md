# Packages `kelec-settings` et `kelec-preferences`

L'onglet « Réglages » contient :
- des liens (feedback, traduction, Discord) ;
- la synchro Apple Watch ;
- la déconnexion ;
- les préférences d'affichage et de la voiture ;
- une section Debug.

Deux packages le composent :
- **`kelec-settings`** (feature) : l'écran, avec ses contrôleurs et ses vues.
- **`kelec-preferences`** (domaine partagé) : les préférences de l'app (`AppPreferences`), leur stockage et leur mise à jour.
  Ce package est utilisé par Réglages, la page carte (type de carte) et `Main` (chargement), et lu par de nombreuses features via `MainContext`.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-preferences/                    (domaine partagé, importé via index.ts)
├── models/preferencesChanges.ts      applyChanges (copie + dépendances), affectsWidgets
├── services/preferencesRepository.ts get / update (stockage + envoi aux widgets si besoin)
├── controllers/usePreferences.ts     { preferences, update(patch) } : enregistre puis recharge dans toute l'app
└── index.ts

kelec-settings/                       (feature)
├── services/
│   ├── externalLinks.ts        URLs (feedback, traduction, Discord, LinkedIn) + ouverture
│   ├── appleWatchSync.ts       Envoi du compte, des préférences et des cookies à la montre
│   ├── widgetLogsExport.ts     (Debug) export des logs des widgets
│   ├── userDisplayName.ts      Prénom / nom affichés dans l'en-tête
│   └── timezoneOffsets.ts      Décalages proposés (-5 … +5)
├── controllers/
│   ├── settingsTypes.ts        OptionType, SettingItem, SettingSection
│   └── useSettingsController.ts Sections (déclaratives) + actions + état des modales
└── views/
    ├── SettingsView.tsx        Écran
    ├── SettingsHeader.tsx      En-tête orange (nom ou « Réglages », crédits)
    ├── SettingsSection.tsx     Une section et ses lignes
    ├── SettingRow.tsx          Une ligne (navigation ou interrupteur)
    ├── TimezoneOffsetModal.tsx Choix du décalage horaire des charges programmées
    └── debug/DebugZoneView.tsx Zone de debug (laissée telle quelle, exclue de Sonar)
```

Le modèle `AppPreferences` reste dans `src/lib/appPreferences` : il est importé par `src/lib` (apiHandlers, utils graphiques).
Le déplacer dans un package ferait dépendre `src/lib` d'un package, c'est-à-dire la dépendance à l'envers.

## Mise à jour d'une préférence

1. Un contrôleur appelle `usePreferences().update({ champ: valeur })`.
2. `PreferencesRepository.update` crée une **copie** des préférences avec les changements (`applyChanges`). Il ne modifie plus l'objet du contexte.
   Règle de dépendance : désactiver `displayMiles` désactive aussi `convertToMiles`.
3. La copie est enregistrée (`AppStorage`, clé `appPreferences`).
4. **Widgets natifs** : ils ne lisent que `displayMiles` et `convertToMiles` (iOS et Android). `saveNativePreferences` n'est donc appelé
   que si l'un de ces deux champs change (`affectsWidgets`).
5. `reloadAppPreferences()` recharge les préférences dans toute l'app.

L'**Apple Watch** ne reçoit les préférences que via le bouton « Sync with Apple Watch » (`syncWithAppleWatch`), jamais automatiquement.

## Sections

Les sections sont décrites de façon déclarative dans `useSettingsController`. Chaque ligne a :
- `icon` (qui sert aussi au `testID` : `testSettingRow<icon>`), `title`, `description` éventuelle ;
- `type` (`NAVIGATE` ou `SWITCH`), `onPress`, `switchValue` ;
- `visible` (ex. « Convertir en miles » n'est visible que si les miles sont activés) ;
- `showTitle` au niveau de la section (la section « Général » n'a pas de titre).

Ces indicateurs remplacent les anciennes comparaisons de textes traduits (`item.title == getTranslation("convertToMiles")`).

## Stockage

| Clé | Contenu | Propriétaire |
|---|---|---|
| `appPreferences` | `AppPreferences` (JSON) | `kelec-preferences` |
| `appPreferences` (stockage partagé natif) | Mêmes préférences, lues par les widgets | `kelec-preferences` (`saveNativePreferences`) |

## Historique du refactor

- `screen/loggedIn/SettingsTab/` a été déplacé dans `kelec-settings`, et `SettingsView` (455 lignes) a été découpé en contrôleur, services et vues.
- `storageHandler.getAppPreferences` / `setAppPreferences` ont été remplacés par `PreferencesRepository`. La page carte (`mapType`) passe aussi par `usePreferences`.
- **Fuseau horaire** : la sélection rechargeait les préférences sans attendre la fin de l'enregistrement. Elle attend maintenant, puis ferme la fenêtre.
- **Modification directe de l'objet du contexte** (`appPreferences.hideMap = …`) : elle est remplacée par une copie.
- **Debug zone** : seul le fichier a été déplacé, sans toucher au contenu en dehors des chemins d'import. L'exclusion correspondante a été mise à jour dans `sonar-project.properties`.
  Elle contient un import de `BigButton`, un fichier qui n'existe plus : c'est l'une des 2 erreurs TypeScript connues.
  Babel supprime cet import inutilisé, donc il n'a pas d'effet à l'exécution.
- La déconnexion utilise encore `storageHandler.logOut`. Elle sera migrée avec la persistance du compte dans `kelec-garage`.

## Tests

- `__tests__/packages/kelec-preferences/preferences.test.ts` :
  - valeurs par défaut, copie sans modifier l'original ;
  - widgets mis à jour seulement quand les unités changent ;
  - dépendance miles → conversion.
- `__tests__/packages/kelec-settings/settingsServices.test.ts` : nom affiché, décalages horaires.
- Tests d'intégration : `__tests__/SettingsView/SettingsView.test.tsx`, avec un nouveau test sur la sélection du fuseau horaire (valeur enregistrée, fenêtre fermée, valeur affichée à la réouverture).
