# Natif iOS : widgets, bridge RN, Apple Watch

Synthèse du refactor du code natif iOS (6 octobre 2026) : le diagnostic de départ, les décisions prises,
et l'organisation qui en résulte.

Périmètre : le bridge React Native, les widgets iOS (écran d'accueil, écran verrouillé, Tempo), l'intent Siri,
l'app Apple Watch et ses widgets, et le package `renaultApi`. Le natif Android est décrit dans [native-android.md](native-android.md).

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
│   ├── Formatting.swift            Dates, « 2h05 », « 45 801 », icône de batterie, couleur de charge, localized(_:)
│   ├── WidgetComponents.swift      widgetBackground(), CarWidgetStateView, WidgetStyle, carStatusIcon, extension `ApiHandler` (couleur et durée de charge)
│   └── PreviewData.swift           Données de démo des widgets (dont les 5 états des previews)
├── Kelec/RNSharedWidget.swift (+ .m)  Bridge RN en Swift, méthodes en promesses
├── Intents/                        CarEntity / CarQuery, LaunchHVACIntent (Siri), GetCarStatusIntent (état de la voiture)
├── KeleciOSWidget/                 Widgets iOS : providers, vues (Small, Medium, Tempo, écran verrouillé), Tempo.swift,
│                                   contrôle « confort thermique » (LaunchHVACControl, iOS 18)
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
| `<vin>/savedTemperature` | UserDefaults.standard (montre) | Dernière température du préchauffage (`"21"`), même clé et format que l'app RN (AsyncStorage) | `CarViewModel` | App de la montre |
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

## Parcours d'un rafraîchissement

### Widgets iOS (écran d'accueil, écran verrouillé)

1. WidgetKit appelle `Provider.timeline(for:in:)` (`KeleciOSWidget.swift`) : à la pose du widget, puis toutes les 15 min
   (`.after(nextRefresh)`, l'heure exacte reste décidée par iOS), et quand l'app RN appelle `refreshWidgets` ou
   écrit des données (`setData`, rechargement regroupé après 0,5 s).
2. `VehicleLoader.loadWidgetData { widgetCar(account:configuredVin:) }` :
   - préférences (`SharedStore.loadPreferences`) et compte (`SharedStore.loadAccount`) ; pas de compte → widget « non connecté » ;
   - choix de la voiture : celle configurée sur le widget (`ConfigurationAppIntent.car`), sinon la première ;
   - image de la voiture (`<vin>/image`) ;
   - `VehicleLoader.fetchStatus` : `getCarMakerApiClient` (Renault group avec le cookie de session du Keychain,
     Hyundai avec le mot de passe du Keychain, démo) → `getVehicleInfo(vin:)`.
3. Succès : `VehicleCache.saveStatus` (cache par VIN) et `SharedHistory.record` (`<vin>_batteryStatus`, kilométrage).
   Échec : `VehicleCache.loadStatus`, sinon aucune donnée → widget « erreur serveur ».
4. Une seule entrée par timeline, valable jusqu'au prochain rafraîchissement.

Chaque widget charge sa voiture de son côté : deux widgets sur la même voiture font deux requêtes.

### Widgets Tempo

Même chargement de la voiture, puis `TempoService.fetch()` (API RTE, cache dans `UserDefaults.standard` sous `tempo`),
seulement si une voiture est affichée.

### Montre

- **Widgets** (`KelecWatchOSWidget.swift`, `StaticConfiguration`) : même parcours, avec `watchCar` (voiture choisie dans
  les Réglages de l'app de la montre, sinon la première). Les données viennent de la synchro iPhone → montre.
- **App** : `ContentView` lit le compte (une page par voiture, puis les Réglages) et se recharge à chaque synchro
  (`WatchSync.lastSyncDate`). `CarViewModel.load()` affiche d'abord le cache (`VehicleLoader.cachedStatus`), puis le
  statut chargé ; `refresh()` recharge aussi les widgets de la montre.
- **Préchauffage** : la confirmation est une feuille (une alerte ne peut pas contenir de réglage) avec un `Stepper`
  et la Digital Crown. Températures de `HvacTemperature` (`Shared/ApiClients.swift`) : 17 à 27 °C, LOW / HIGH aux
  bornes, 21 °C par défaut, comme `kelec-hvac/models/Temperature.ts`. Enregistrée par voiture à chaque changement.

### Intent Siri / Raccourcis (`LaunchHVACIntent`)

Paramètres : la voiture et la température (`Stepper` de 17 à 27 °C, 21 °C par défaut, aussi pour les raccourcis
créés avant ce paramètre ; valeurs en dur, AppIntents exige des littéraux). Retrouve la voiture par VIN dans le compte,
envoie `sendHVACCommand` (`launchHvac` du client du constructeur) et répond par un dialogue traduit
(`preHeatLaunchedOn %@ %@` ou `preHeatLaunchError %@`). Textes du raccourci : `launchPreHeatSummary ${car} ${temperature}`,
`launchPreHeatTemperature`, `launchPreHeatCarDescription`, `launchPreHeatTemperatureDescription`.

### Raccourci « Obtenir l'état de [voiture] » (`GetCarStatusIntent`)

Action Raccourcis (target de l'app) qui renvoie un `CarStatusEntity` (`TransientAppEntity`) : chaque propriété garde
son type et sert aux actions suivantes du raccourci (« Si [État → Niveau de batterie] < 20 »…).

- Données : `VehicleLoader.fetchStatus` (requête, sinon cache), compilé aussi dans la target de l'app pour cette action.
- Propriétés : voiture, niveau de batterie, autonomie et kilométrage (mesures en km, Raccourcis convertit), statut de
  charge (`CarChargeStatus`, `AppEnum`), branchée, temps de charge restant (seulement en charge), limite de charge et verrouillage (absents chez Renault group),
  dernière mise à jour.
- Statut de charge : `ApiHandler.getChargeStatus()` du package (`ChargeStatus`), même correspondance que l'app RN
  (`renaultApiHandler.tsx`, codes `chargingStatus` de Renault ; règles de `getChargeText` pour Hyundai).
- Siri répond par `carStatusDialog %@ %@ %@ %@` (« Zoé : 80 % · 245 km · En charge »), l'autonomie selon les préférences.
- Erreurs : `widgetNoCarSelected` (voiture introuvable), `widgetServerError` (ni réponse ni cache).

### Contrôle « confort thermique » (`LaunchHVACControl`, iOS 18)

Bouton du Centre de contrôle, de l'écran verrouillé et du bouton Action, dans l'extension des widgets iOS
(`if #available(iOS 18.0, *)` dans le bundle, l'extension ciblant iOS 17.6).

- Un contrôle ne peut rien demander au tap : la voiture et la température (17 à 27 °C, 21 °C par défaut) se choisissent
  à l'ajout (`LaunchHVACControlConfiguration`, `promptsForUserConfiguration`), puis par appui long → Modifier.
  Plusieurs contrôles peuvent coexister (autre voiture, autre température).
- Au tap, `LaunchHVACControlIntent` (masqué de Raccourcis, l'intent Siri reste `LaunchHVACIntent`) s'exécute dans
  l'extension : compte de l'App Group, puis `sendHVACCommand`. En cas d'échec il lève une erreur
  (`widgetNoCarSelected` ou `commandSendError`) et écrit dans `widgetLogs`.
- Pas de dernière température de l'app : elle est dans AsyncStorage, illisible depuis le natif.
- Textes : `launchPreHeat`, `launchPreHeatControlDescription`, et ceux de l'intent Siri pour les paramètres.

## Affichage des widgets

`CarWidgetStateView` (`Shared/WidgetComponents.swift`) choisit l'état avant d'afficher le contenu :

| Cas | Affichage |
|---|---|
| Pas de compte | `widgetNotLoggedIn` (« Vous devez d'abord vous connecter sur l'appli ») |
| Compte sans voiture | `widgetNoCarSelected` |
| Aucune donnée (échec sans cache) | `widgetServerError` (« Impossible de se connecter au serveur ») |
| Données (réseau ou cache) | Contenu du widget ci-dessous |

| Widget | Contenu |
|---|---|
| Petit (accueil) | Modèle, éclair si branchée, niveau (%), puis durée restante (« 2h05 ») en charge, sinon autonomie |
| Moyen (accueil) | Logo du constructeur, modèle, cadenas ouvert si non verrouillée, niveau, barre de charge (limite de charge), puissance instantanée (> 0,5 kW), état et autonomie, heure du statut ; branchée : durée restante et heure de fin ; image de la voiture |
| Moyen « Alternative » | Mêmes données, autre mise en page (`MediumAlt1`) |
| Écran verrouillé en ligne | Icône d'état (`carStatusIcon`) et niveau |
| Écran verrouillé rectangulaire | Icône d'état, modèle, niveau et autonomie |
| Écran verrouillé rond (et « Alternative ») | Jauge du niveau ; logique d'icône inversée, gardée telle quelle (voir les décisions) |
| Tempo (1 ou 2 jours) | Couleur du jour (et du lendemain) et prix HP / HC, avec les données de la voiture |
| Montre | Rond, en ligne, rectangulaire (comme l'écran verrouillé), coin : niveau et barre de progression |

- Statut de charge : `ApiHandler.getChargeStatus()` (un par constructeur) ; `getChargeText()` (« EN CHARGE | », « V2G | »…,
  vide si non branchée) et `getIsV2GorV2L()` en sont déduits une seule fois, dans l'extension du protocole.
- Couleur de charge (`ApiHandler.chargingColour`) : vert, orange en V2G / V2L ; gris ou noir quand elle n'est pas branchée.
- Durée restante : « --h-- » si elle ne charge pas ou est pleine (`chargingTimeText`).
- Autonomie convertie selon `AppPreferences`, unité « mi » si `displayMiles` (`getUnitsText`).
- Fond blanc des widgets (iOS 17 / watchOS 10) : `widgetBackground()`.
- Previews Xcode : `SimpleEntry.previewStates` montre les 5 états de `PreviewData`.

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
- Montre et Siri/Raccourcis : « préchauffage » devient « confort thermique » en français (`preHeatLaunched`, `launchPreHeat`, `areYouSureYouWantToLaunchPreheating`). Les clés ne changent pas, et les autres langues et `localizations.json` non plus.
- La clé RN `isSelectedAsDefault` de `localizations.json` n'est plus utilisée (fichier non modifié).
- Ajouter un texte : une clé (pas une phrase) dans les 19 `Localizable.strings`, puis `Text("clé")` ou `localized("clé")`.
  Les fichiers doivent être membres des targets qui l'affichent (app, widgets iOS, widgets de la montre).

## Compiler et tester

- Projet : `ios/Kelec.xcworkspace` (CocoaPods : `cd ios && pod install`). Schémas : `Kelec` (app, widgets iOS, intent),
  `KeleciOSWidgetExtension`, `KelecWatchOs Watch App`, `KelecWatchOSWidgetsExtension`, `renaultApi`.
- Package seul : `cd ios/Packages/RenaultApi && swift build` (plateforme macOS déclarée).
- Pendant un refactor, sans build complet : `swiftc -typecheck` par target (voir les décisions).
- Ajouter un fichier à `Shared/` : l'ajouter aux targets avec la gem `xcodeproj`, pas à la main dans le `pbxproj`.
- À vérifier sur appareil après un changement :
  - un widget déjà posé s'affiche toujours ; « Modifier le widget » propose les voitures (nom, plaque) ;
  - widgets en langue autre que le français (ex. portugais, qui plantait) ;
  - synchro de la montre depuis Réglages → « Synchroniser avec l'Apple Watch », app de la montre fermée ;
  - choix de la voiture des widgets de la montre (Réglages de la montre) ;
  - Siri / Raccourcis : « confort thermique » sur une voiture.
  - Raccourci « Obtenir l'état » : propriétés dans une action suivante, condition sur le statut de charge, Renault et Hyundai.
  - Contrôle du Centre de contrôle (iOS 18) : ajout (choix de la voiture et de la température), tap, échec réseau.
- Débogage : Réglages → Debug → « export widget logs » (`widgetLogs`, 5 jours, messages de `VehicleLoader`,
  `getCarMakerApiClient` et du client Renault), et « Debug zone » (choix d'une voiture, « Battery status »
  pas à pas, « Mileage history » : 10 dernières entrées de `<vin>_mileageHistory`, export des logs en texte).

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
