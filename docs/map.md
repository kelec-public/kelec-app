# Packages `kelec-map` et `kelec-weather`

La carte de la page voiture (mini-carte) et la carte plein écran affichent la dernière position connue de la voiture,
avec la météo à cet endroit, le choix plan / satellite et un bouton d'itinéraire.

- **`kelec-map`** (feature) : position de la voiture (par constructeur), mini-carte, carte plein écran.
- **`kelec-weather`** (domaine partagé) : météo actuelle à une position. Aujourd'hui, il n'est utilisé que par la carte,
  mais il n'a rien de propre à la carte et pourra servir ailleurs.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-weather/                        (domaine partagé, importé via index.ts)
├── models/Weather.ts                 Weather (température, URL de l'icône), WeatherState (loading | error | loaded)
├── types/weatherApi.ts               Format de la réponse de weatherapi.com (utilisé par le modèle et le service)
├── services/weatherClient.ts         Appel weatherapi.com (clé WEATHER_API_KEY)
├── controllers/useWeather.ts         Météo à une position ; aucun appel si la position est null
├── views/WeatherBadge.tsx            Pastille : chargement, erreur, ou icône + température
└── index.ts

kelec-map/                            (feature)
├── models/CarLocation.ts             latitude, longitude, updatedAt
├── services/
│   ├── createLocationSource.ts       Choix de la source selon le constructeur
│   ├── sources/
│   │   ├── renaultLocationSource.ts  Renault / Dacia / Alpine : API + cache <vin>/locationStatus
│   │   ├── hyundaiLocationSource.ts  Hyundai : position lue dans le statut de la voiture (CarStatusCache)
│   │   └── demoLocationSource.ts     Données de démo
│   └── mapLinks.ts                   Type satellite par plateforme, ouverture de l'app de cartes (maps:// / geo:)
├── controllers/MapProvider.tsx       useCarLocation() → { carModel, location, isMapVisible, weather, sync }
├── views/
│   ├── MapCard.tsx                   Mini-carte de la page voiture
│   ├── FullScreenMapView.tsx         Carte plein écran
│   ├── MapTypeSelector.tsx           Plan / satellite
│   └── CarMarker.tsx                 Pin de la voiture (photo dans un rond + pointe)
├── types/locationSource.ts           Interface LocationSource
├── routes.ts                         MAP_ROUTE
└── index.ts
```

## Flux de données

1. `MapProvider` est monté par voiture dans `CarsPageView`, à côté des providers des charges et du HVAC.
2. Au montage : `source.loadCached()`.
3. Après un fetch batterie réussi, `CarView` appelle `sync()` dans le même `onNetworkLoaded` que les charges et le HVAC.
4. **Visibilité** : la mini-carte n'est affichée que si `isMapVisible`, c'est-à-dire si la position est connue et que la carte
   n'est pas masquée dans les réglages. Cette règle unique remplace `apiHandler.shouldDisplayMap()` et le test `hideMap` qui était fait dans `MapCard`.
5. **Météo** : elle est chargée par le provider, **une seule fois** pour les deux cartes, et **seulement si la carte est visible**,
   pour ne pas consommer le quota de l'API météo. Elle est rechargée quand la position change.
6. **Carte plein écran** : elle lit la position, la voiture et la météo dans le provider. Elle ne reçoit plus rien par les paramètres de route,
   donc elle se met à jour si les données sont rafraîchies pendant qu'elle est ouverte.
7. **Type de carte** : il est enregistré dans les préférences (`usePreferences().update({ mapType })`).

## Pastilles flottantes (`FloatingPill`, kelec-model)

Tous les éléments blancs posés sur les cartes (météo, retour, plein écran, recentrer, plan/satellite, itinéraire) utilisent
`kelec-model/view/FloatingPill`. Il est dans le package d'infrastructure UI parce que `kelec-weather` (domaine) et `kelec-map` (feature) s'en servent tous les deux.

- **Taille commune déduite de l'icône** : `FLOATING_PILL_SIZE` = icône (`FLOATING_PILL_ICON_SIZE`) + 2 × marge interne + 2 × bordure.
  Aucune valeur n'est écrite dans les vues.
  - Pastilles avec texte : hauteur **minimale** `FLOATING_PILL_SIZE`, et dans une ligne en `alignItems: 'stretch'`, elles prennent la hauteur de la plus haute.
  - Pastilles rondes (`round`, icône seule) : taille **fixe** `FLOATING_PILL_SIZE`, jamais étirées, pour rester rondes.
- **À ne pas faire** : `aspectRatio` + `flexGrow` + `stretch` pour les pastilles rondes. Dans un conteneur sans taille fixe, le moteur de mise en page
  les fait grossir sans limite. C'était le cas lors d'un premier essai : boutons énormes, et « Marcher vers… » poussé hors de l'écran.
- `selected` : fond gris et bordure (plan/satellite).
- La carte plein écran s'ouvre en modale : il n'y a pas de marge de sécurité en haut (la ligne du haut a donc une marge de 15),
  mais il y en a une en bas (barre d'accueil) : le bloc du bas est dans un `SafeAreaView edges={['bottom']}`, plus une marge de 15.
- Les tailles réelles ne sont pas calculées par jest : le rendu se vérifie à l'écran (iOS et Android).

## Pin de la voiture (`CarMarker`)

Un rond avec la photo de la voiture (`useCarImage`, kelec-garage) et une pointe en dessous. Si la voiture n'a pas de photo, une icône de voiture est affichée à la place.
Tailles : `small` (mini-carte) et `large` (plein écran).

Points importants pour Android (`react-native-maps` y dessine le marqueur en image, en dehors de l'affichage normal) :
- **`react-native-maps` ≥ 1.29.5** : les versions précédentes créaient une image trop petite, et seul le coin haut-gauche du pin était affiché
  (changelog 1.29.5 : *« custom Marker views clipped due to undersized bitmap »*). Le projet utilise la 1.29.8.
- **La photo doit être un enfant direct du `Marker`.** `react-native-maps` ne déclenche le chargement d'une `<Image>` sur Android
  (`hackToHandleDraweeLifecycle`, qui appelle `onAttachedToWindow` puis redessine le marqueur quand l'image est affichée) que pour ses **enfants directs**.
  Imbriquée dans d'autres vues, la photo n'est jamais chargée : ni `onLoad` ni `onError`, et le rond reste vide.
  D'où la structure : 1er enfant = le pin (rond + pointe), 2e enfant = la photo en `position: 'absolute'` dans le rond, rendue ronde par son propre `borderRadius`.
- **Pas de rotation ni d'`elevation`** : elles débordent de la vue et sont coupées. La pointe est un triangle en bordures, et l'ombre n'est appliquée que sur iOS.
- **`tracksViewChanges`** reste actif jusqu'au chargement de la photo, plus 300 ms le temps du dernier rendu (avec un filet de sécurité de 3 s), puis passe à `false`.
- **La pointe est sur la position** : `anchor={{ x: 0.5, y: 1 }}` (Android) et `centerOffset` = -(hauteur totale / 2) (iOS).

## Stockage

| Clé | Contenu | Propriétaire |
|---|---|---|
| `<vin>/locationStatus` | Réponse brute de l'API position Renault | `kelec-map` (`RenaultLocationSource`) |
| `<vin>/batteryStatus` | Statut Hyundai (lu seulement, pour la position) | `kelec-car-page` (`CarStatusCache`) |
| `appPreferences.mapType` | Type de carte | `kelec-preferences` |

## Pourquoi pas de repository ni d'interface de source dans `kelec-weather`

- **Repository** : il sert à la persistance, or la météo n'est pas stockée (pas de cache).
- **Interface de source** (comme `LocationSource`) : elle n'a de sens qu'avec plusieurs implémentations. Il n'y a qu'un fournisseur (weatherapi.com) ;
  on l'ajoutera s'il en arrive un deuxième ou un mode démo.

## Historique du refactor

- `screen/.../Elements/MapCard.tsx` et `Elements/Map/FullScreenMapView.tsx` ont été déplacés dans `kelec-map` (avec `git mv`),
  et `Elements/Map/WeatherMapCard.tsx` a été remplacé par `WeatherBadge`.
- `lib/clients/weather/weatherClient.tsx` a été déplacé dans `kelec-weather`, et `WeatherApiHandler` remplacé par le modèle `Weather`.
- `setLocationStatus`, `shouldDisplayMap`, `getMapLatitude`, `getMapLongitude` et `getLastMapUpdateDate` ont été retirés de l'`ApiHandler`
  et de ses implémentations. Le slot `locationStatus` a été retiré de `RenaultCarLoader`, et `setLocationStatus` du loader démo.
- La conversion de date Hyundai est sortie dans `lib/clients/carMakers/hyundaiTime.ts` (`parseHyundaiTime`), partagée entre l'`HyundaiApiHandler` et la source de position.
- La route `'MapView'` est exportée par `kelec-map` (`MAP_ROUTE`) au lieu d'être écrite en dur. Ses paramètres (coordonnées, date, image,
  et l'objet météo, qui n'était pas sérialisable) sont supprimés.
- **Correctif** : pendant le chargement et en cas d'erreur, la pastille météo affichait aussi une image vide et « ° », parce que `undefined !== null` est vrai.
  Elle n'affiche maintenant qu'un seul état.
- **Marqueur avec la photo de la voiture** : l'ancien marqueur commenté (bogué, coupé sur Android) a été réécrit dans `CarMarker`, voir ci-dessous.

## Tests

- `__tests__/packages/kelec-weather/weather.test.tsx` : construction du modèle, et un seul état affiché par la pastille (pas de « ° » pendant le chargement ou en cas d'erreur).
- `__tests__/packages/kelec-weather/useWeather.test.ts` (avec `fetch` simulé) : aucun appel sans position, chargement, erreur de l'API, erreur réseau, rechargement quand la position change.
- `__tests__/packages/kelec-map/CarMarker.test.tsx` : placement de la pointe, icône sans photo, `tracksViewChanges` jusqu'au chargement (+ 300 ms, et filet de sécurité), aucune rotation, photo en enfant direct du `Marker` et affichée aussi sur Android.
- `__tests__/packages/kelec-map/location.test.ts` : `parseHyundaiTime`, `locationFromRenault`, source Renault (cache, erreur), source Hyundai.
- Tests d'intégration existants, inchangés : `__tests__/CarView/MapCard.renault.test.tsx` et `MapCard.hyundai.test.tsx`.
