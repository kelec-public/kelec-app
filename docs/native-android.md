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
| `<vin>/carData` | `DATA` en clair | Dernier statut batterie (cache du widget) | Widget | Widget |
| `<vin>_batteryStatus` | `DATA` en clair | Dernier statut batterie Renault (même format) | Widget | App RN |
| `<vin>_mileageHistory` | `DATA` en clair | Kilométrage du dernier mois (`[{mileage, timestamp ISO}]`) | Widget | App RN (historique de charge) |
| `<vin>/image` | `DATA` en clair | Image base64 (jamais lue) | Bridge RN | — |
| `<vin>_password` | `DATA` chiffré | Mot de passe du compte | Stockage chiffré RN | Widget |
| `cookieValue_<email>` | `DATA` chiffré | Session Renault (JSON `{canLogin, cookieValue}`) | Stockage chiffré RN | Widget |
