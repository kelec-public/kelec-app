# Ouvrir une voiture depuis le système (`kelec-car-shortcuts`)

Chaque voiture du compte est proposée par le système. Toucher l'une d'elles ouvre l'app directement sur sa page.

| Entrée | iOS | Android |
|---|---|---|
| Recherche système | Spotlight (CoreSpotlight) : nom de la voiture, image en vignette | Recherche du launcher (selon le launcher), via les raccourcis |
| Appui long sur l'icône | Quick Actions | Raccourcis dynamiques, épinglables sur l'écran d'accueil |
| Tap sur un widget | Ouvre la voiture du widget (`widgetURL`) | Ouvre la voiture du widget |

Seul le nom de la voiture est affiché (`model`), sans sous-titre : aucune traduction n'est nécessaire.

## Parcours

1. **Mise à jour des entrées** (natif, sans passer par le JS) : au lancement de l'app, et quand l'app RN enregistre
   le compte (`setData("account")`, regroupé après 0,5 s). Sur iOS, aussi quand elle enregistre une image (`<vin>/image`,
   vignette de Spotlight). Déconnexion (compte `null`) : plus aucune entrée.
   - iOS : `CarShortcuts.update()` (`ios/Kelec/CarShortcuts.swift`) : Spotlight (domaine `cars`, identifiant = VIN,
     voitures retirées supprimées de l'index) et `UIApplication.shortcutItems` (type `openCar`, `userInfo.vin`).
   - Android : `CarShortcuts.update` (`android/.../shortcuts/CarShortcuts.kt`) : raccourcis dynamiques (`car_<vin>`,
     icône `ic_shortcut_car`). Le raccourci épinglé d'une voiture retirée est désactivé (il ne peut pas être supprimé).
2. **Ouverture** : le VIN est mis en attente dans le module natif `OpenCarRequests`, qui émet `openCarRequested`.
   - iOS : `SceneDelegate` (lancement : `connectionOptions` ; app ouverte : `openURLContexts`, `continue userActivity`,
     `performActionFor shortcutItem`).
   - Android : `MainActivity` (`onCreate`, `onNewIntent` en `singleTask`). Ignoré en relançant l'app depuis les récents.
3. **Côté RN** : `useOpenCarRequest` (monté dans `CarsPageView`) lit la demande au montage (app lancée par la demande),
   puis à chaque évènement. `CarsPageView` revient sur l'onglet des voitures et appelle `pagerRef.setPage(index)`.
   Une demande n'est lue qu'une fois ; un VIN inconnu (voiture supprimée) est ignoré.

## Lien d'une voiture

`kelec://car/<vin>` : `CarLink` (`ios/Shared/CarLink.swift`, app et widgets iOS) et `CarShortcuts.uri` (Android).

- iOS : schéma `kelec` déclaré dans `Info.plist` (`CFBundleURLTypes`). Les widgets de la montre ne l'utilisent pas.
- Android : intent **explicite** vers `MainActivity` (pas d'`intent-filter`). Le lien sert à distinguer les voitures
  (deux `PendingIntent` qui ne diffèrent que par leurs extras seraient confondus).

## Module natif `OpenCarRequests`

Même nom et mêmes méthodes sur les deux plateformes : `consume()` (VIN ou `null`, puis efface la demande),
évènement `openCarRequested` (sans contenu). Absent dans les tests : le hook ne fait alors rien.

## À vérifier sur appareil

- Lancement à froid et app en arrière-plan, pour chaque entrée (Spotlight, Quick Action, raccourci, widget) : la bonne
  page s'affiche, y compris depuis l'onglet Compte ou Réglages.
- Ajout, suppression d'une voiture, déconnexion : Spotlight et raccourcis suivent.
- Android : raccourci épinglé d'une voiture supprimée (désactivé), relance depuis les récents (pas de saut de page).
