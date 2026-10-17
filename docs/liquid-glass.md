# Liquid glass (iOS 26)

Les boutons flottants et les petits boutons icône utilisent l'effet liquid glass d'iOS 26, via `@callstack/liquid-glass`.
Partout ailleurs (Android, iOS 25 et moins), le rendu d'avant est gardé : pas de flou imité, c'est le style natif de chaque plateforme.

La barre d'onglets passe aussi en liquid glass, mais par la barre native du système : voir [tab-bar.md](tab-bar.md).

## La bibliothèque

- `LiquidGlassView` : vue en verre (`tintColor`, `interactive`, `colorScheme`, `effect`).
- `isLiquidGlassSupported` : vrai seulement sur iOS 26+. Sur iOS < 26, la lib rend une `View` ; sur Android, elle n'a pas de code natif.
- Build : Xcode 26 minimum, sinon l'effet n'apparaît pas.
- Jest : la lib est simulée dans `jest.setup.js` (`isLiquidGlassSupported: false`). **Les tests ne passent donc que par le rendu sans verre** :
  le verre se vérifie à l'écran.

## Composants (`kelec-model`)

Les vues ne testent jamais `isLiquidGlassSupported` elles-mêmes : elles passent par l'un de ces deux composants.

### `FloatingPill`

Pastilles posées sur la carte (météo, retour, plein écran, recentrer, plan/satellite, itinéraire) : voir aussi [map.md](map.md).
Toujours en verre sur iOS 26+.

### `GlassButton`

Bouton icône, avec texte éventuel. Utilisé par :

| Écran | Boutons |
|---|---|
| `BottomSheet` | croix de fermeture (toutes les bottom sheets) |
| `StepLayout` | croix de fermeture (`addBackButton`) |
| `TemperaturePicker` (kelec-hvac) | + et − |
| `ProfileHeader` (kelec-profile) | crayon, +, « Ajouter un véhicule » |
| `CarViewHeader` (kelec-car-page) | café |
| `SummaryCard` | roue crantée (modèle du véhicule) |
| `ChargesHistoryView`, `ActiveFiltersRow` (kelec-charge-history) | retour, « … », chips de filtres |

- `glassStyle` : forme du verre (padding, `borderRadius`), sur iOS 26+ ; `fallbackStyle` : rendu d'avant, ailleurs.
  `fallbackIconColour` / `fallbackTextColour` gardent les couleurs d'avant (ex. `onSecondaryContainer` des chips).
- Sur le verre, texte et icône prennent la couleur du texte du thème (`getBlackColour`) : une couleur de thème sur un verre neutre se lit mal.
- `iconFamily` : `'material'` (défaut) ou `'community'` (MaterialCommunityIcons, ex. le café). `iconPosition` : icône avant ou après le texte.
- `selected` : teinte translucide, via `getSelectedGlassTint` (crayon en mode édition ; `FloatingPill` l'utilise aussi pour plan/satellite).
- `disabled` : opacité 0,4 dans les deux rendus (+ et − aux bornes de température).
- Les `testID` restent sur le bouton (et `iconTestID` sur l'icône) : les tests existants n'ont pas changé.

## Règles

- **Pas de bordure sur le verre.** La lib pose le verre dans le cadre intérieur à la bordure, alors que les enfants sont placés
  depuis le bord extérieur : avec une bordure de 2, le contenu est décalé de 2 vers la droite et le bas. `FloatingPill` met
  `borderWidth: 0` et compense par le padding pour garder la même taille.
- **Teinte translucide uniquement.** Une couleur opaque (ex. `getLightGray` en sombre) recouvre le verre : on obtient un rond plein.
  `getSelectedGlassTint` (`GlassButton.tsx`) : noir à 18 % en clair, blanc à 30 % en sombre.
- **Pas d'ombre ni de fond** sur la version verre : le verre dessine les siens.
- `colorScheme` est passé explicitement (thème de l'app), pas `system` : le thème de l'app peut différer de celui du téléphone.
- `interactive` (le verre réagit au toucher) remplace l'assombrissement de `TouchableOpacity` (`activeOpacity={1}`).

## Où ne pas en mettre

- Les grands boutons pleins (`Button` : dégradés, couleurs de marque, « Faire un don », « Retour ») : sur iOS 26, Apple garde aussi des boutons d'action opaques.
- Le pin de la voiture (`CarMarker`) : il est figé en image (`tracksViewChanges`), alors que le verre floute ce qu'il y a derrière en direct.
