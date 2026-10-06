# Natif iOS : widgets, bridge RN, Apple Watch

Synthèse du refactor du code natif iOS (6 octobre 2026) : le diagnostic de départ, les décisions prises,
et l'organisation qui en résulte.

Périmètre : le bridge React Native, les widgets iOS (écran d'accueil, écran verrouillé, Tempo), l'intent Siri,
l'app Apple Watch et ses widgets, et le package `renaultApi`. Le natif Android n'est pas couvert (à faire plus tard).

## Diagnostic de départ

~4 200 lignes de Swift / ObjC, difficiles à maintenir :

- **Duplication** : la chaîne de l'App Group copiée ~15 fois, 3 implémentations du Keychain,
  4 copies de « compte → voiture → client → requête → cache », les données de démo des widgets ×6,
  le fond iOS 17 des widgets ×8, l'image de la voiture ×3, le format « 2h05 » ×4…
- **Responsabilités mal placées** : les modèles partagés rangés dans le dossier du widget et compilés dans 4 targets,
  le package `renaultApi` qui écrivait dans le stockage de l'app, deux stockages (`UserDefaults.standard` et App Group)
  sans règle.
- **Bugs** :
  - crash des widgets en portugais (et dans toute langue sans dossier `.lproj` exact) ;
  - sémaphores bloquants mélangés à `async/await` ;
  - `as!` pouvant planter ;
  - synchro de la montre perdue si l'app de la montre n'était pas ouverte ;
  - règles de choix de voiture incohérentes ;
  - **mots de passe envoyés et stockés en clair sur la montre**.

## Décisions prises

| Sujet | Décision |
|---|---|
| Mots de passe sur la montre | Le compte part **sans mot de passe**. Seuls les mots de passe Hyundai sont envoyés (Renault n'utilise que le cookie de session), et la montre les range dans son Keychain (`<vin>_password`). |
| Synchro iPhone → montre | `updateApplicationContext` au lieu de `sendMessage` : la dernière valeur est livrée même si l'app de la montre est fermée. |
| PIN Hyundai | **Gardé en clair** dans le JSON du compte. Le sortir changerait un champ déjà stocké sur les téléphones. |
| Voiture par défaut (`selectedCar`) | **Supprimée** de l'app (modèle, onglet Profil, texte du bas). Un ancien compte qui la contient est lu sans erreur. |
| Choix de voiture des widgets de la montre | **Pas de réglage par widget** : `AppIntentConfiguration` a été essayé puis retiré, car watchOS ne proposait pas les widgets par voiture. Une page **Réglages** dans l'app de la montre choisit la voiture de tous ses widgets. |
| Version minimale de la montre | **watchOS 10** (app et widgets). L'ancienne API de carte est supprimée. |
| Package `renaultApi` | **Rapatrié en package local** (`ios/Packages/RenaultApi`), puis nettoyé : clients d'API uniquement, il n'écrit plus dans le stockage de l'app. Le nom `renaultApi` est gardé. |
| Jauge ronde de l'écran verrouillé | **Gardée telle quelle**. Sa logique d'icône est inversée (branchée mais pas en charge = `car.fill`, contre `bolt` ailleurs). |
| Traductions | Les phrases françaises qui servaient de clés sont remplacées par de vraies clés, traduites dans les 19 langues. |
| Tests | Les modèles de tests vides sont supprimés. Il n'y a pas de tests natifs pour l'instant. |
| Vérification | Pas de build Xcode pendant le refactor : `swiftc -typecheck` par target, jest et `tsc`. Les tests sur appareil sont faits à la fin. |

## Organisation actuelle

```
ios/
├── Shared/                         Compilé dans plusieurs targets (app, widgets iOS, app et widgets montre)
│   ├── AppGroup.swift              Identifiant de l'App Group + StorageKey (toutes les clés, jamais renommées)
│   ├── Keychain.swift              read / save / delete (mêmes attributs que le stockage chiffré RN)
│   ├── SharedStore.swift           Compte, préférences, image de la voiture, voiture des widgets de la montre
│   ├── SharedHistory.swift         writeWidgetLog, historique de kilométrage, statut batterie Renault (lus par l'app RN)
│   ├── VehicleCache.swift          Dernier statut et dernière position par voiture (UserDefaults.standard)
│   ├── VehicleLoader.swift         Requête + cache + historique ; widgetCar / watchCar (choix de la voiture)
│   ├── ApiClients.swift            getCarMakerApiClient, mot de passe (Keychain), sendHVACCommand, client RTE
│   ├── RenaultSession.swift        Cookies de session Renault (Keychain)
│   ├── Models.swift                UserAccount, UserCar (+ maker: CarMaker), CarModel
│   ├── Formatting.swift            Dates, « 2h05 », couleur de charge, localized(_:)
│   ├── WidgetComponents.swift      widgetBackground(), CarWidgetStateView, WidgetStyle, carStatusIcon
│   └── PreviewData.swift           Données de démo des widgets
├── Kelec/RNSharedWidget.swift (+ .m)  Bridge RN en Swift, méthodes en promesses
├── Intents/                        CarEntity / CarQuery, LaunchHVACIntent (Siri)
├── KeleciOSWidget/                 Widgets iOS : providers, vues (Small, Medium, Tempo, écran verrouillé), Tempo.swift
├── KelecWatchOs Watch App/         WatchSync, CarViewModel, vues (CarView, BatteryCardView, MapView, WatchSettingsView)
├── KelecWatchOSWidgets/            Widgets de la montre (configuration statique)
└── Packages/RenaultApi/            Package local renaultApi : clients Renault group, Hyundai, démo, RTE Tempo
```

Les fichiers de `Shared/` sont ajoutés aux targets avec la gem `xcodeproj` (installée avec CocoaPods),
pas en modifiant le `pbxproj` à la main.

## Stockage partagé

**Règle : ne jamais renommer une clé ni changer un format.** Ces données sont déjà sur les téléphones,
et l'app RN en lit une partie.

| Clé | Où | Contenu | Écrit par | Lu par |
|---|---|---|---|---|
| `account` | App Group | `UserAccount` sans mot de passe (`String` sur iPhone, `Data` sur la montre) | Bridge RN / `WatchSync` | Widgets, intent, montre |
| `appPreferences` | App Group | `AppPreferences` | Bridge RN / `WatchSync` | Widgets, montre |
| `<vin>/image` | App Group | Image base64 | Bridge RN | Widgets iOS |
| `widgetLogs` | App Group | Logs des 5 derniers jours (`[{date, message}]`) | `writeWidgetLog` | App RN (export) |
| `<vin>_mileageHistory` | App Group | Kilométrage du dernier mois (`[{mileage, timestamp ISO}]`) | `SharedHistory` | App RN (historique de charge) |
| `<vin>_batteryStatus` | App Group | Dernier `RenaultBatteryStatus` | `SharedHistory` | App RN |
| `watchWidgetCar` | App Group (montre) | VIN choisi dans les Réglages de la montre | `WatchSettingsView` | Widgets de la montre |
| `<vin>_password` | Keychain | Mot de passe du compte | Stockage chiffré RN / `WatchSync` (Hyundai) | Clients d'API, intent |
| `cookieValue_<email>` | Keychain | Session Renault | App RN / `WatchSync` | Client Renault |
| `RENAULT_carsLoaded`, `HYUNDAI_carsLoaded` | App Group | Cache du dernier statut par VIN | `VehicleCache` | App et widgets (iPhone et montre) : le dernier chargement gagne |
| `savedLocation_<vin>` | App Group | Dernière position | `VehicleCache` | Idem |
| `tempo` | UserDefaults.standard | Cache Tempo | `TempoService` | Widgets iOS (local) |

## Bridge RN (`RNSharedWidget`)

Module Swift qui garde le même nom côté JS. Toutes ses méthodes renvoient une promesse :
`setData`, `getData` (valeur `Data` ou `String`, `null` si absente), `setCryptedData`, `getCryptedData`,
`clearCryptedData`, `refreshWidgets`.

Une série de `setData` (compte, préférences, images) ne recharge les widgets qu'une fois (après 0,5 s).
Côté JS, tout passe par `src/lib/storage/sharedPlatformsData.tsx`. Les appels iOS ne plantent pas si le module est absent (tests).

## Synchro iPhone → montre

1. L'app RN (Réglages → « Synchroniser avec l'Apple Watch », `appleWatchSync.ts`) envoie par `updateApplicationContext` :
   - `message` : le compte, **sans mot de passe** (`withoutPasswords`) ;
   - `appPreferences` ;
   - `cookieValue` : les sessions Renault, par email ;
   - `passwords` : les mots de passe Hyundai, par VIN.
2. Sur la montre, `WatchSync` (un seul delegate, activé au lancement par `WatchAppDelegate`) :
   - range cookies et mots de passe dans le Keychain. Une clé absente n'efface rien ;
   - enregistre compte et préférences s'ils ont changé, recharge les widgets et met à jour `lastSyncDate`.
3. Le contexte est aussi lu à l'activation (données arrivées app fermée). Les tâches d'arrière-plan
   WatchConnectivity sont gérées : la montre peut enregistrer la synchro sans que l'app soit ouverte.
4. `didReceiveMessage` est gardé pour un iPhone encore en ancienne version.

## Choix de la voiture affichée

| Où | Règle |
|---|---|
| Widgets iOS | La voiture configurée sur le widget (« Modifier le widget »), sinon la première |
| Widgets de la montre | La voiture choisie dans les **Réglages de l'app de la montre**, sinon la première |
| Widgets Android | La voiture configurée sur le widget, sinon la première (avant : la voiture par défaut) |

### Liste de choix de la voiture (widget iOS et intents)

- `CarEntity` (`ios/Intents/CarEntity.swift`) affiche le nom de la voiture, avec en sous-titre la plaque brute (`registrationNumber`, non formatée) ou, à défaut, le VIN.
- `CarModel.registrationNumber` (`ios/Shared/Models.swift`) est optionnel : champ déjà sérialisé par l'app, absent pour certaines voitures.
- L'entité est partagée avec l'intent Siri/Raccourcis (`LaunchHVACIntent`) : le sous-titre y apparaît aussi.

## Package `renaultApi` (`ios/Packages/RenaultApi`)

- Ancien dépôt `github.com/kelec-public/renault-api-swift-client` (1.0.9), repris avec le correctif du crash portugais.
  `Package.resolved` supprimé, il ne servait qu'à l'épingler.
- Clients d'API uniquement : il n'écrit plus dans le stockage et n'importe plus SwiftUI.
- `RenaultApiClient(…, logger:)` : l'app y branche `writeWidgetLog`.
- `ApiHandler.getVehicleData()` renvoie `VehicleData` (`.renault` / `.hyundai` / `.demo`) au lieu de `Any`.
- `ApiHandler.getOdometerInKm()` sert à l'historique de kilométrage.
- Plus de `!` sur les URL : `ApiClientError.invalidURL`.

## Traductions iOS

- Fichiers : `ios/<langue>.lproj/Localizable.strings` (19 langues). Ils sont maintenant aussi embarqués dans les widgets de la montre, qui affichaient toujours du français.
- Clés : `widgetNotLoggedIn`, `widgetNoCarSelected`, `widgetServerError`, `carMakerServerError %@`, `refresh`,
  `widgetHomeScreenDescription`, `widgetLockScreenDescription`, `tempo*`, `watch*`…
- En SwiftUI, `Text("clé")` avec une chaîne littérale est traduit. `Text(variable)` ne l'est pas : utiliser `LocalizedStringKey` ou `localized(_:)`.
- Les fichiers ne contiennent plus le doublon de `error`. Les erreurs de traduction existantes (catalan, croate, norvégien, tchèque, italien) sont corrigées.
- Montre et Siri/Raccourcis : « préchauffage » devient « confort thermique » en français (`preHeatLaunched`, `launchPreHeat`, `launchPreHeat ${car}`, `areYouSureYouWantToLaunchPreheating`). Les clés ne changent pas, et les autres langues et `localizations.json` non plus.
- La clé RN `isSelectedAsDefault` de `localizations.json` n'est plus utilisée (fichier non modifié).

## Commits

| Commit | Contenu |
|---|---|
| `db28a49` | Correctifs : crash portugais, sémaphores, `as!`, choix de voiture, synchro montre (`updateApplicationContext`), mots de passe dans le Keychain de la montre |
| `02df6cd` | `ios/Shared` : AppGroup, Keychain, SharedStore, VehicleLoader, PreviewData ; Tempo |
| `948c201` | Composants de vues partagés des widgets |
| `484bd03` | Modèles et helpers dans `ios/Shared`, code mort supprimé |
| `6fa4b34` | Bridge RN réécrit en Swift |
| `337afe0` | Montre : synchro au niveau de l'app, réveil en arrière-plan, ViewModel par voiture |
| `3e004bc` | Clés de traduction au lieu des phrases françaises |
| `2f05d25` | Noms de vues clairs, paramètres inutilisés supprimés |
| `410f030` | Préchauffage dans le ViewModel, nouvelle API MapKit |
| `e9e8156`, `d4eff1a` | Modèles de tests vides supprimés, `Podfile` / `Podfile.lock` |
| `105ff53`, `4b9d336` | Traductions des nouveaux textes, corrections de traductions |
| `8d23511` | watchOS 10 minimum, ancienne carte supprimée |
| `cf22d10`, `2ea4bab` → `4d3dbd0`, `b886b9a` | Réglage par widget sur la montre, essayé puis annulé |
| `63b667a` | Suppression de la voiture par défaut (`selectedCar`) |
| `15f0c51` | Réglages de la montre : voiture des widgets |
| `8ea3728` | `renaultApi` en package local |
| `e6fdfae` | `renaultApi` n'écrit plus dans le stockage de l'app |
| `f5ec45f` | `UserCar.maker` (constructeur typé) |
| `36f8d9e` | `VehicleData`, plus de `!` dans les clients d'API, `WidgetStyle` |
