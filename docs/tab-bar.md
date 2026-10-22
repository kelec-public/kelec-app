# Barre d'onglets native

`src/screen/loggedIn/Home.tsx` utilise `createNativeBottomTabNavigator` (`@react-navigation/bottom-tabs/unstable`),
qui s'appuie sur les onglets natifs de `react-native-screens` :

| Plateforme | Barre |
|---|---|
| iOS 26+ | barre système en liquid glass, flottante par-dessus le contenu |
| iOS < 26 | barre iOS classique |
| Android | barre Material (`BottomNavigationView`), elle aussi posée par-dessus le contenu |

L'API est marquée **unstable** dans React Navigation 7 (stable en v8), et la marge Android vient de `react-native-screens/experimental` :
à retester en priorité à chaque mise à jour de React Navigation ou de `react-native-screens`.

## Configuration

- **Icônes** : SF Symbols sur iOS (`car.fill`, `person.fill`, `gearshape.fill`, noms typés), MaterialIcons converties en image sur Android
  (`Icon.getImageSourceSync`). Les composants `react-native-vector-icons` ne sont pas acceptés par la barre native.
- **Couleurs** : onglet actif bleu, autres gris. Fond gris sur Android ; aucun fond sur iOS (il cacherait le verre).
- `lazy: true` : comme l'ancienne barre JS, un onglet n'est monté qu'à sa première ouverture (le défaut natif est `false`).
- **Le navigateur est créé hors du composant.** `Home` a un état (barre masquée) : recréé à chaque rendu, le navigateur remonterait tous les onglets.
- Les noms des onglets sont les titres traduits (inchangé).

## Le bas des écrans

La barre est par-dessus le contenu sur les deux plateformes : chaque onglet doit laisser sa place, de deux façons différentes.

### iOS : le contenu défile sous le verre

- La liste principale de chaque écran a `contentInsetAdjustmentBehavior="automatic"` : iOS ajoute lui-même la hauteur de la barre en bas
  (et décale la barre de défilement). C'est le cas de `CarView`, `ProfileView`, `SettingsView` et `ChargesHistoryView`.
  **Un nouvel écran avec une liste dans un onglet doit faire de même.**
- `react-native-screens` le fait seul (`overrideScrollViewContentInsetAdjustmentBehavior`), mais seulement si la liste est
  la première vue de chaque niveau de l'écran. Chez nous, ce n'est jamais le cas (une `Modal`, une `SafeAreaView`, un en-tête passent avant).
- Une `SafeAreaView` ne convient pas pour ça : elle arrêterait la liste au-dessus de la barre, sans contenu sous le verre.
- **Réglages** : la liste commence tout en haut, iOS la décale donc aussi sous la barre d'état. La `SafeAreaView` de `SettingsHeader`
  ne gère plus le haut sur iOS (sinon double marge), et un fond orange (`topFill`) remplit la zone au-dessus de l'en-tête (barre d'état et rebond).

### Fournisseur de marges par onglet

`TabScreenLayout` (`screenLayout` du navigateur) donne à chaque onglet son propre `SafeAreaProvider`.
Une `SafeAreaView` de `react-native-safe-area-context` ne mesure pas sa vue : elle reprend les marges du fournisseur le plus proche.
Placé dans l'écran natif de l'onglet, ce fournisseur a, sur iOS, une marge du bas qui comprend la barre d'onglets.

### Android : la barre réserve sa hauteur

La barre Material ne compte pas dans les marges de l'écran. Sur Android, `TabScreenLayout` enveloppe donc l'onglet dans la `SafeAreaView`
de `react-native-screens/experimental`, avec `insetType="interface"` et la marge du bas : elle réserve exactement la hauteur de la barre
(0 quand la barre est masquée). Le contenu s'arrête au-dessus de la barre, comme avec l'ancienne barre JS.

## Écrans sans barre d'onglets

Les écrans à étapes ouverts depuis l'onglet Voitures ont leurs propres boutons en bas : la barre est masquée tant qu'ils sont affichés
(comme `hidesBottomBarWhenPushed` sur iOS).

- La liste est dans `CarsPageView` (`ROUTES_WITHOUT_TAB_BAR`) : modèle du véhicule, import de charges, double authentification.
- `CarsPageView` suit l'écran affiché (`onStateChange` de chaque `NavigationContainer`) et appelle `setTabBarHidden`
  (`src/lib/Contexts/TabBarContext.tsx`). `Home` passe alors `tabBarStyle: { display: 'none' }`.
- Ces écrans demandent la marge du bas (`safeAreaEdges: ['top', 'bottom']`) : barre masquée, c'est celle de la barre d'accueil (iOS)
  ou de la barre de navigation (Android).
- L'historique des charges garde la barre (page de consultation, sans boutons en bas).

### Android : patch de react-native-screens (appuis sous la barre masquée)

`patches/react-native-screens+4.28.0.patch` (patch-package, appliqué par `postinstall`).

- **Bug** : masquée, la barre Material passe en `GONE` mais garde ses dernières limites (bas de l'écran, ~105 dp).
  `TouchTargetHelper` de React Native, qui choisit la cible des appuis JS, ne regarde pas la visibilité : il parcourt
  les enfants du dernier au premier et tombait sur les items de la barre masquée. Les `Pressable` / `TouchableOpacity`
  de cette zone ne recevaient rien (ex. « ← » et « Confirmer » de `StepLayout`, « Importer »), ou l'appui partait vers
  une autre vue (l'identifiant Android d'un item pris pour un numéro de vue React Native).
  Les vues natives (interrupteur, liste, champ de saisie) marchaient : Android, lui, ignore les vues `GONE`.
- **Correctif** : `TabsAppearanceApplicator.updateSharedAppearance` ramène les limites de la barre masquée à zéro.
  Réaffichée, la barre est remise en page normalement.
- Toujours présent dans react-native-screens 4.30.0 et la 4.31 en développement, et dans `TouchTargetHelper` de React Native 0.87.1.
  **À chaque mise à jour de react-native-screens** : le nom du patch contient la version ; vérifier si le bug est corrigé
  (alors supprimer le patch), sinon régénérer le patch (`npx patch-package react-native-screens --include 'TabsAppearanceApplicator\.kt$'`).
- Les modales (carte plein écran, café, bottom sheets, choix de réglages, zone de debug) passent par-dessus la barre.
  L'ajout de véhicule remplace l'écran entier (`setCurrentView`).

## Tests

La barre est dessinée par le système : il n'y a plus de bouton à presser (les anciens `testID` `bottomButton…` n'existent plus).
`testUtils/tabs.ts` (hors de `__tests__`, sinon jest le prend pour une suite) :

- `selectTab('settings')` : envoie à l'hôte des onglets l'évènement `onTabSelected`, comme un appui sur la barre native.
  Les onglets sont désignés par leur clé de traduction (les tests tournent en français).
- `hasTab('account')` : la barre est affichée avec cet onglet (remplace les anciens `bottomButtonperson.length === 2`).
- `isTabBarHidden()` : la barre est masquée.

Ces fonctions cherchent dans `screen.UNSAFE_root` : `screen.root` ne renvoie que le premier élément hôte (parfois une modale).
`jest.setup.js` simule `Icon.getImageSourceSync` (module natif de vector-icons), utilisé par les icônes Android.

- `__tests__/CarView/CarModelChoiceStep.test.tsx` : la barre est masquée sur le modèle du véhicule, puis réaffichée au retour.
- Le bas des écrans (marges, contenu sous le verre) ne se calcule pas dans jest : il se vérifie à l'écran, sur iOS 26 et Android.
