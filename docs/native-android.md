# Natif Android : widget, bridge RN, préparation de Wear OS

Synthèse du refactor du code natif Android (6 octobre 2026) : le diagnostic de départ, les décisions prises,
et l'organisation qui en résulte. Pendant de [native-ios.md](native-ios.md).

Périmètre : le bridge React Native, le widget de l'écran d'accueil, sa configuration et son rafraîchissement,
les clients d'API Renault, l'app Wear OS. Hyundai reste hors périmètre (le widget Android ne gère que Renault group et la démo).

## Diagnostic de départ

~1 400 lignes de Java / Kotlin :

- **Duplication** : l'ouverture du stockage chiffré écrite 4 fois, la même donnée batterie enregistrée sous
  2 clés (`<vin>_batteryStatus` et `<vin>/carData`), Java et Kotlin mélangés pour le même rôle.
- **Bridge RN** différent de l'iOS : autres noms de méthodes, callbacks au lieu de promesses,
  `""` au lieu de `null` pour une clé absente.
- **Bugs** :
  - plantage de l'app si l'appel du kilométrage (cockpit) échoue (exception sortie d'une coroutine sans gestionnaire) ;
  - mot de passe exigé pour Renault alors que seul le cookie de session sert ;
  - `getEncrypted` renvoyait l'erreur (`"ERROR: …"`) comme une valeur ;
  - `SharedStorage.set` plantait sans activité (`getCurrentActivity()` nul) ;
  - chaque écriture (compte, préférences, image) relançait le réseau pour tous les widgets, et `refreshWidget()` ne faisait rien ;
  - « NE CHARGE PAS » affiché « EN CHARGE », « aucune voiture » affiché « connectez-vous », erreurs en anglais en dur ;
  - `widgetLogs` jamais écrit (export des logs vide sur Android).

## Décisions prises

| Sujet | Décision |
|---|---|
| Hyundai | **Hors périmètre** : le widget Android ne gère toujours que Renault group et la démo. |
| Rendu du widget | **Jetpack Glance** (Compose) depuis l'ajout des tailles 2x2 / 4x2 et des widgets Tempo (8 octobre 2026). Le receiver `KelecMainWIdget` est gardé (il hérite de `GlanceAppWidgetReceiver`) : les widgets déjà posés restent. |
| Stockage chiffré | **Inchangé** : `EncryptedSharedPreferences` (`security-crypto`), fichier `DATA`, partagé avec les données en clair. |
| Vérification | Pas de build Gradle pendant le refactor : jest et `tsc`. La compilation et les tests sur appareil sont faits à la fin. |
| Code partagé | **Modules Gradle** `:carapi` et `:shared`, l'équivalent de `ios/Packages/RenaultApi` et `ios/Shared`, pour être réutilisés par l'app Wear OS. |
| Bridge RN | **Même module que l'iOS** (`RNSharedWidget`, mêmes méthodes) : `sharedPlatformsData.tsx` n'a plus de branche par plateforme pour le stockage. |
| Statut batterie | Écrit sous une seule clé (`<vin>_batteryStatus`). L'ancienne `<vin>/carData` est encore relue, plus écrite. |
| Images des voitures | Écrites par l'app RN (`<vin>/image`), affichées par les widgets 2x2 et 4x2 (réduites à 400 px de large). |
| Widgets Tempo | **Comme sur iOS** : Tempo du jour (avec les prix HP / HC) et Tempo 2 jours, en 4x2, la voiture à gauche. Client RTE porté dans `:carapi` (`RteApiClient`). |

## Organisation actuelle

```
android/
├── carapi/                 Kotlin pur (sans Android), testable en JUnit (`src/test`)
│   ├── RenaultApiClient    fetchStatus(vin) : jeton Gigya (cookie de session) → batterie → kilométrage (facultatif)
│   ├── RenaultServices     Retrofit Gigya / Kamereon, RenaultApiKeys (clés passées par l'app)
│   ├── RteApiClient        Calendrier Tempo de RTE (jeton OAuth puis tempo_like_calendars)
│   ├── Tempo               Deux derniers jours connus, couleurs et prix HP / HC (mêmes valeurs que iOS)
│   ├── BatteryStatus       Statut batterie (format JSON relu par l'app RN), BatteryStatus.demo()
│   └── ChargingState       État de charge à partir du chargingStatus brut
├── shared/                 Bibliothèque Android (com.kelec.shared), pour l'app et la future montre
│   ├── StorageKey          Fichier DATA et toutes les clés (jamais renommées)
│   ├── SharedStore         Stockage en clair : compte, préférences, voiture de chaque widget
│   ├── SecureStore         Stockage chiffré (inchangé) : get / set / remove, cookie Renault
│   ├── SharedHistory       Dernier statut batterie, kilométrage (30 jours), widgetLogs (5 jours)
│   ├── VehicleLoader       Requête + enregistrement + repli sur le cache → VehicleStatus ; cached() : même résultat sans réseau
│   ├── TempoLoader         Requête RTE + cache `tempo` + repli sur le cache
│   ├── Models              UserAccount (carFor), UserCar, CarMaker, AppPreferences
│   ├── Formatting          « 14:05 », « 07/10 14:05 », « 2h05 », « 300 km » / « 186 mi », prix Tempo, libellés des états de charge
│   └── res/values*/        Textes du widget partagés (états de charge, erreurs), 19 langues
└── app/
    ├── KelecMainWIdget     Receiver du widget batterie (CarStatusWidget)
    ├── ApiKeys             Clés d'API du .env (BuildConfig) pour :carapi (Renault, RTE)
    ├── bridge/             RNSharedWidget, NativeLanguage, WearSync (synchro de la montre), OpenCarRequests, KelecPackage
    ├── shortcuts/          CarShortcuts : un raccourci par voiture, lien kelec://car/<vin> (docs/car-shortcuts.md)
    ├── widgets/            KelecWidgetReceiver (base des receivers + receivers Tempo, RefreshWidgetsAction),
    │                       CarStatusWidget (4x1, 2x2, 4x2), TempoWidget / Tempo2DaysWidget, WidgetComponents,
    │                       WidgetData (état lu sans réseau), WidgetUpdater (réseau puis updateAll),
    │                       WidgetRefreshWorker (CoroutineWorker), WidgetConfigureActivity
    └── modules/autofill/   Autofill du formulaire de connexion
wear/                       App Wear OS (Compose for Wear OS) : écrans, synchro reçue, complications
```

Java 17 et les dépôts Maven des nouveaux modules sont réglés par le plugin Gradle de React Native
(`JdkConfiguratorUtils`, `DependencyUtils`) : ne pas fixer `sourceCompatibility` à la main
(conflit avec la toolchain).

## Widgets

| Widget | Receiver (ne jamais renommer) | Tailles | Contenu |
|---|---|---|---|
| Batterie | `com.kelec.KelecMainWIdget` | 4x2 par défaut, redimensionnable : barre 4x1 (le widget historique), carré 2x2, large 4x2 | Selon la taille : 4x1 = logo, nom, niveau, jauge, état, autonomie, temps de charge, heure ; 2x2 = petit widget iOS ; 4x2 = widget moyen iOS |
| Tempo | `com.kelec.widgets.KelecTempoWidgetReceiver` | 4x2 | Voiture (vue 2x2) + dernier jour Tempo connu, avec les prix HP / HC |
| Tempo 2 jours | `com.kelec.widgets.KelecTempo2DaysWidgetReceiver` | 4x2 | Voiture (vue 2x2) + les deux derniers jours connus |

- **Glance dessine sans réseau** (`WidgetData`) : compte, voiture du widget, `VehicleLoader.cached` (démo, pas de session,
  dernier statut enregistré), image de la voiture, cache Tempo. C'est exactement le résultat du dernier chargement.
- **Le réseau passe par `WidgetRefreshWorker`** : `WidgetUpdater.update` charge chaque voiture une fois (et Tempo s'il y a
  un widget Tempo), ce qui met le cache à jour, puis redessine chaque type de widget (`updateAll`).
- La mise en page du widget batterie suit `SizeMode.Responsive` (110x40, 110x110, 250x110 dp) : `LocalSize` choisit la vue.
- Aperçus du sélecteur : `kelec_main_w_idget.xml` (widget 4x2) et `tempo_*_widget_preview.xml`, des layouts statiques
  avec la Mégane en dur (`widget_preview_megane`, comme les aperçus iOS).

## Rafraîchissement des widgets

- Tout passe par `WidgetRefreshWorker` : toutes les 15 min (tâche périodique `kelec_widget_refresh`),
  et à la demande en tâche unique `kelec_widget_refresh_now` (bridge RN, bouton de l'heure, choix de la voiture).
- `refreshNow` ne fait rien s'il n'y a aucun widget, et reprogramme la tâche périodique (`KEEP`).
  Tant qu'une tâche reste en attente, WorkManager ne désactive pas son `RescheduleReceiver` :
  sinon, le changement de composant renverrait `APPWIDGET_UPDATE` et relancerait un rafraîchissement en boucle.
- Plusieurs widgets sur la même voiture ne font qu'une requête.
- Voiture du widget : celle configurée (`widget_vin_<id>`), sinon la première du compte.

### Parcours d'un rafraîchissement

1. Un déclencheur : la tâche périodique, `APPWIDGET_UPDATE` (pose du widget, redémarrage), l'heure du widget
   (`RefreshWidgetsAction`), l'app RN (`setData` après 0,5 s ou `refreshWidgets`), le choix de la voiture.
2. `KelecWidgetReceiver.onReceive` → `WidgetRefreshWorker.refreshNow` → tâche unique `kelec_widget_refresh_now`.
   Pour `APPWIDGET_UPDATE`, Glance dessine d'abord avec le cache.
3. `WidgetRefreshWorker.doWork` → `WidgetUpdater.update` (tous les widgets, tous types) :
   - lit les préférences et le compte (`SharedStore`) ;
   - choisit la voiture de chaque widget ;
   - charge chaque voiture une seule fois avec `VehicleLoader.load`, et Tempo avec `TempoLoader.load` s'il y a un widget Tempo ;
   - redessine les widgets (`CarStatusWidget().updateAll`, `TempoWidget().updateAll`…), qui relisent le cache.
4. `VehicleLoader.load(car)` :
   - voiture de démo → `BatteryStatus.demo()`, sans réseau ;
   - pas de cookie de session (`SecureStore.renaultCookieValue`) → `NotLoggedIn` ;
   - sinon `RenaultApiClient.fetchStatus` → enregistre `<vin>_batteryStatus` et le kilométrage → `Loaded` ;
   - en cas d'échec → dernier statut enregistré (`Loaded(fromCache = true)`), sinon `Unavailable`.

## Affichage du widget

| Cas | Affichage (`WidgetData` → `CarStatusWidget`) |
|---|---|
| Pas de compte (déconnecté) | « Vous devez d'abord vous connecter sur l'appli » (`not_yet_logged_in`) |
| Compte sans voiture | « Vous devez d'abord sélectionner une voiture… » (`no_car_added`) |
| Pas de session Renault | `not_yet_logged_in` |
| Échec sans cache | « Impossible de se connecter au serveur » (`widget_server_error`), « … serveur Renault » sur les widgets Tempo (`tempo_car_server_error`) |
| Widget Tempo sans données RTE (ni réseau ni cache) | « Impossible de se connecter au serveur RTE » (`tempo_rte_server_error`) |
| Statut chargé (réseau ou cache) | Logo du constructeur, modèle, niveau (%), barre de progression, autonomie, heure du statut |
| Branchée | Libellé de l'état (`EN CHARGE |`, `CHARGE PLANIFIÉE |`, `CHARGE TERMINÉE |`, `NE CHARGE PAS |`, `V2G`, `V2L`), barre « en charge » |
| En charge | Durée restante (« 2h05 ») et heure de fin, sinon « --h-- » |

- Autonomie : convertie en miles si `convertToMiles`, unité « mi » si `displayMiles` (deux réglages distincts, comme l'app).
- Toucher le widget ouvre l'app sur la page de sa voiture (`CarShortcuts.openIntent`) ; toucher l'heure relance le chargement.
- Une voiture Hyundai est traitée comme Renault (hors périmètre) : elle affiche `not_yet_logged_in`.

## Textes et traductions

- `shared/src/main/res/values*/strings.xml` : textes utilisés par `:shared` (états de charge, erreurs), à lire avec
  `com.kelec.shared.R` (alias `SharedR` dans l'app).
- `app/src/main/res/values*/strings.xml` : textes propres à l'app (configuration du widget, widgets Tempo, textes des aperçus).
  Les textes Tempo viennent des `Localizable.strings` iOS (`BLUE`, `tempoRteServerError`…).
- `values/` est le français (langue par défaut), puis 18 langues (`values-en`, `values-de`…). Un nouveau texte doit être
  ajouté dans les 19 dossiers ; les traductions des widgets iOS (`ios/<langue>.lproj/Localizable.strings`) peuvent servir.

## Compiler et tester

- `cd android && ./gradlew :carapi:test` : tests JUnit du client et des modèles (sans émulateur).
- `./gradlew :app:assembleDebug` : compile les trois modules (l'app avec Compose et Glance).
- À vérifier sur appareil après un changement du widget : un widget déjà posé s'affiche toujours, le bouton de l'heure,
  le choix de la voiture, les trois tailles du widget batterie (redimensionner), les widgets Tempo (jour et 2 jours),
  le mode sombre, l'historique de kilométrage dans l'app, l'export des logs.
- Réglages → Debug → « Debug zone » (côté RN) : choix d'une voiture, puis « Battery status » (appel Renault pas à pas)
  ou « Mileage history » (10 dernières entrées écrites par le widget), avec export des logs en fichier texte.

## Logs du widget

Comme sur iOS : `SharedHistory.writeWidgetLog` ajoute `{date ISO, message}` à `widgetLogs` (5 derniers jours),
exporté depuis Réglages → Debug → « export widget logs » (iOS : `Share`, Android : `react-native-share`).
Messages : début du rafraîchissement, préférences trouvées ou non, compte ou voiture absents, voiture configurée
ou repli sur la première, cookie chargé ou absent, jeton JWT et statut batterie (OK ou erreur avec la cause),
kilométrage en échec, données chargées ou repli sur le cache.

## Bridge RN (`RNSharedWidget`)

Même nom et mêmes méthodes que sur iOS, toutes en promesses :
`setData`, `getData` (`null` si absente), `setCryptedData`, `getCryptedData` (`null` si absente ou illisible),
`clearCryptedData`, `refreshWidgets`. Une série de `setData` ne recharge le widget qu'une fois (après 0,5 s).
`NativeLanguage.getLanguage()` (synchrone) reste à part.

## App Wear OS (`:wear`)

Pendant de l'app Apple Watch (8 octobre 2026). Module `:wear` (Compose for Wear OS), qui dépend de `:shared`.

| Apple Watch | Wear OS |
|---|---|
| `ContentView` : une page par voiture, puis les Réglages | `KelecWearApp` : `HorizontalPager` + indicateur de page |
| `CarView` / `BatteryCardView` : cache puis réseau, niveau, image, jauge, état et autonomie, temps de charge | `CarScreen` (`VehicleLoader.cached` puis `load`) |
| Confort thermique : feuille avec `Stepper` et couronne, 17 à 27 °C, `<vin>/savedTemperature` | `HvacConfirmDialog` : - / +, couronne ou lunette (`onRotaryScrollEvent`), même clé |
| `MapView` (MapKit) | `CarMapDialog` (Google Maps, `maps-compose`, clé `MAPS_API_KEY` du `.env`) |
| `WatchSettingsView` : voiture des widgets (`watchWidgetCar`) | `SettingsScreen` : voiture des complications, même clé |
| Widgets (circulaire, coin, inline, rectangulaire) | Complications `BatteryComplicationService` : `RANGED_VALUE`, `SHORT_TEXT`, `LONG_TEXT`, toutes les 15 min |
| `WatchSync` (`updateApplicationContext`) | `WatchSync` + `WatchSyncListenerService` (Wearable Data Layer) |

- **Constructeurs** : Renault group et démo, comme le widget Android (`VehicleCommands` pour le confort thermique et la position).
  Hyundai est hors périmètre : la page affiche l'erreur serveur.
- **Même `applicationId`** que l'app du téléphone (`com.myrenaultplus`, obligatoire pour la Data Layer) et même signature.
  `versionCode` différent (`2000294`) : à monter avec celui de l'app à chaque version.
- `com.google.android.wearable.standalone = false` : l'app a besoin du téléphone pour le compte et les sessions.

### Synchro téléphone → montre

1. Réglages RN → « Synchroniser avec la montre » (`syncWithWearOsWatch` sur Android) → `sendDataToAppleWatch`
   (`sharedPlatformsData.tsx`), qui appelle le module natif `WearSync` sur Android.
2. `WearSync.sync` écrit un seul `DataItem` (`/kelec/sync`, `WearSyncContract`) : compte sans mot de passe (`message`),
   `appPreferences`, sessions Renault par email (`cookieValue`), mots de passe Hyundai par VIN (`passwords`), `timestamp`.
   Même contenu que pour l'Apple Watch. La dernière valeur est livrée même si l'app de la montre est fermée.
3. Sur la montre, `WatchSyncListenerService` (réveillé par le système) et `WatchSync.loadLatest` (au lancement) :
   - sessions → stockage chiffré (`cookieValue_<email>`), mots de passe → `<vin>_password` (une clé absente n'efface rien) ;
   - compte et préférences → `account` / `appPreferences` s'ils ont changé, puis complications rechargées
     et `WatchSync.lastSync` mis à jour (les écrans se rechargent).

### Textes

`wear/src/main/res/values*/strings.xml`, 19 langues, repris des `Localizable.strings` iOS. Les deux textes qui parlaient
de l'iPhone (`watch_open_phone_to_sync`, `watch_add_vehicle_on_phone`) ont été réécrits avec « téléphone ».

### Compiler

`./gradlew :wear:assembleDebug`, puis installer sur une montre appairée avec le même téléphone (même signature que l'app).
