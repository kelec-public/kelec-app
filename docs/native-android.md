# Natif Android : widget, bridge RN, préparation de Wear OS

Synthèse du refactor du code natif Android (6 octobre 2026) : le diagnostic de départ, les décisions prises,
et l'organisation qui en résulte. Pendant de [native-ios.md](native-ios.md).

Périmètre : le bridge React Native, le widget de l'écran d'accueil, sa configuration et son rafraîchissement,
les clients d'API Renault. Hyundai reste hors périmètre (le widget Android ne gère que Renault group et la démo).

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
  - images base64 des voitures écrites dans les SharedPreferences sans être lues ;
  - `widgetLogs` jamais écrit (export des logs vide sur Android).

## Décisions prises

| Sujet | Décision |
|---|---|
| Hyundai | **Hors périmètre** : le widget Android ne gère toujours que Renault group et la démo. |
| Rendu du widget | **RemoteViews gardé** (pas de Glance). Le rendu ne change pas. |
| Stockage chiffré | **Inchangé** : `EncryptedSharedPreferences` (`security-crypto`), fichier `DATA`, partagé avec les données en clair. |
| Vérification | Pas de build Gradle pendant le refactor : jest et `tsc`. La compilation et les tests sur appareil sont faits à la fin. |
| Code partagé | **Modules Gradle** `:carapi` et `:shared`, l'équivalent de `ios/Packages/RenaultApi` et `ios/Shared`, pour être réutilisés par l'app Wear OS. |
| Bridge RN | **Même module que l'iOS** (`RNSharedWidget`, mêmes méthodes) : `sharedPlatformsData.tsx` n'a plus de branche par plateforme pour le stockage. |
| Statut batterie | Écrit sous une seule clé (`<vin>_batteryStatus`). L'ancienne `<vin>/carData` est encore relue, plus écrite. |
| Images des voitures | Plus écrites sur Android (jamais lues) ; celles déjà enregistrées sont supprimées au lancement. |

## Organisation actuelle

```
android/
├── carapi/                 Kotlin pur (sans Android), testable en JUnit (`src/test`)
│   ├── RenaultApiClient    fetchStatus(vin) : jeton Gigya (cookie de session) → batterie → kilométrage (facultatif)
│   ├── RenaultServices     Retrofit Gigya / Kamereon, RenaultApiKeys (clés passées par l'app)
│   ├── BatteryStatus       Statut batterie (format JSON relu par l'app RN), BatteryStatus.demo()
│   └── ChargingState       État de charge à partir du chargingStatus brut
├── shared/                 Bibliothèque Android (com.kelec.shared), pour l'app et la future montre
│   ├── StorageKey          Fichier DATA et toutes les clés (jamais renommées)
│   ├── SharedStore         Stockage en clair : compte, préférences, voiture de chaque widget
│   ├── SecureStore         Stockage chiffré (inchangé) : get / set / remove, cookie Renault
│   ├── SharedHistory       Dernier statut batterie, kilométrage (30 jours), widgetLogs (5 jours)
│   ├── VehicleLoader       Requête + enregistrement + repli sur le cache → VehicleStatus
│   ├── Models              UserAccount (carFor), UserCar, CarMaker, AppPreferences
│   ├── Formatting          « 14:05 », « 2h05 », « 300 km » / « 186 mi », libellés des états de charge
│   └── res/values*/        Textes du widget partagés (états de charge, erreurs), 19 langues
└── app/
    ├── KelecMainWIdget     AppWidgetProvider : délègue tout rafraîchissement à WidgetRefreshWorker
    ├── ApiKeys             Clés d'API du .env (BuildConfig) pour :carapi
    ├── bridge/             RNSharedWidget, NativeLanguage, KelecPackage
    ├── widgets/            WidgetUpdater (une requête par VIN), KelecWidgetViews (RemoteViews),
    │                       WidgetRefreshWorker (CoroutineWorker), WidgetConfigureActivity
    └── modules/autofill/   Autofill du formulaire de connexion
```

Java 17 et les dépôts Maven des nouveaux modules sont réglés par le plugin Gradle de React Native
(`JdkConfiguratorUtils`, `DependencyUtils`) : ne pas fixer `sourceCompatibility` à la main
(conflit avec la toolchain).

## Rafraîchissement du widget

- Tout passe par `WidgetRefreshWorker` : toutes les 15 min (tâche périodique `kelec_widget_refresh`),
  et à la demande en tâche unique `kelec_widget_refresh_now` (bridge RN, bouton de l'heure, choix de la voiture).
- `refreshNow` ne fait rien s'il n'y a aucun widget, et reprogramme la tâche périodique (`KEEP`).
  Tant qu'une tâche reste en attente, WorkManager ne désactive pas son `RescheduleReceiver` :
  sinon, le changement de composant renverrait `APPWIDGET_UPDATE` et relancerait un rafraîchissement en boucle.
- Plusieurs widgets sur la même voiture ne font qu'une requête.
- Voiture du widget : celle configurée (`widget_vin_<id>`), sinon la première du compte.

## Bridge RN (`RNSharedWidget`)

Même nom et mêmes méthodes que sur iOS, toutes en promesses :
`setData`, `getData` (`null` si absente), `setCryptedData`, `getCryptedData` (`null` si absente ou illisible),
`clearCryptedData`, `refreshWidgets`. Une série de `setData` ne recharge le widget qu'une fois (après 0,5 s).
`NativeLanguage.getLanguage()` (synchrone) reste à part.

## Préparer l'app Wear OS

- Module `:wear` (app Wear OS + Tiles / Complications) qui dépend de `:shared` : stockage, chargement,
  mise en forme et textes sont déjà disponibles.
- Synchro téléphone → montre : **Wearable Data Layer** (`DataClient` / `DataItem`), l'équivalent de
  `updateApplicationContext` (la dernière valeur est livrée même si l'app de la montre est fermée).
  `react-native-watch-connectivity` ne gère que l'Apple Watch : il faudra un module natif côté téléphone.
- Mêmes règles que sur iOS : le compte part sans mot de passe, seuls les cookies Renault sont envoyés
  et la montre les range dans son stockage chiffré (`cookieValue_<email>`).
- La montre aura besoin de ses propres `RenaultApiKeys` (son `BuildConfig`).

## Noms à ne jamais changer

Ces noms sont enregistrés par le système ou déjà sur les téléphones :

- **`com.kelec.KelecMainWIdget`** (avec la faute de frappe) : le lanceur garde les widgets posés par ce nom de classe.
  Le renommer supprime les widgets déjà installés.
- **`com.kelec.widgets.WidgetRefreshWorker`** et le nom de tâche **`kelec_widget_refresh`** : WorkManager garde
  la tâche périodique avec le nom de la classe.
- **`com.kelec.widgets.WidgetConfigureActivity`** : référencée par `kelec_main_w_idget_info.xml`.
- Les clés de stockage ci-dessous.

## Stockage

**Règle : ne jamais renommer une clé ni changer un format.** L'app RN en lit une partie.

Les deux stockages utilisent le même fichier de SharedPreferences, `DATA` : les entrées chiffrées
(clés et valeurs chiffrées par `EncryptedSharedPreferences`) y côtoient les entrées en clair.

| Clé | Où | Contenu | Écrit par | Lu par |
|---|---|---|---|---|
| `account` | `DATA` en clair | `UserAccount` sans mot de passe (JSON) | Bridge RN | Widget, configuration du widget |
| `appPreferences` | `DATA` en clair | `AppPreferences` (JSON) | Bridge RN | Widget |
| `widget_vin_<id>` | `DATA` en clair | VIN choisi pour le widget `<id>` | Configuration du widget | Widget |
| `<vin>_batteryStatus` | `DATA` en clair | Dernier statut batterie Renault (`BatteryStatus`) | Widget | Widget (cache), app RN |
| `<vin>/carData` | `DATA` en clair | Ancien cache du widget (même format) | Plus écrit | Widget, si `<vin>_batteryStatus` est absent |
| `<vin>_mileageHistory` | `DATA` en clair | Kilométrage des 30 derniers jours (`[{mileage, timestamp ISO}]`) | Widget | App RN (historique de charge) |
| `widgetLogs` | `DATA` en clair | Logs des 5 derniers jours (`[{date ISO, message}]`) | Widget | App RN (export) |
| `<vin>/image` | `DATA` en clair | Image base64 d'anciennes versions | Plus écrit, supprimé au lancement | — |
| `<vin>_password` | `DATA` chiffré | Mot de passe du compte | Stockage chiffré RN | App RN (le widget Renault n'en a pas besoin) |
| `cookieValue_<email>` | `DATA` chiffré | Session Renault (JSON `{canLogin, cookieValue}`) | Stockage chiffré RN | Widget |

## Commits

| Commit | Contenu |
|---|---|
| `68c72da` | Inventaire (ce document) |
| `38d20c8` | Correctifs : plantage du kilométrage, mot de passe inutile, `getEncrypted`, activité nulle, messages du widget |
| `cb3f8e7` | Modules `:carapi` et `:shared`, widget en Kotlin, une requête par voiture, `widgetLogs` |
| `ed16304` | Bridge RN en Kotlin avec la même API que l'iOS, `sharedPlatformsData.tsx` simplifié |
| `0222349` | Rafraîchissement dans un `CoroutineWorker` |
| `b7d41f6`, `790747f` | Ménage (Glance, viewBinding, permission, textes, images) et corrections de relecture |
