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
│   └── mapButtonStyle.ts             Bouton rond flottant
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
- **Marqueur avec la photo de la voiture** : il est **gardé en commentaire** dans les deux cartes (il était bogué, à reprendre).
  Pour le réactiver, l'image s'obtient avec `useCarImage(vin)` (kelec-garage).

## Tests

- `__tests__/packages/kelec-weather/weather.test.tsx` : construction du modèle, et un seul état affiché par la pastille (pas de « ° » pendant le chargement ou en cas d'erreur).
- `__tests__/packages/kelec-weather/useWeather.test.ts` (avec `fetch` simulé) : aucun appel sans position, chargement, erreur de l'API, erreur réseau, rechargement quand la position change.
- `__tests__/packages/kelec-map/location.test.ts` : `parseHyundaiTime`, `locationFromRenault`, source Renault (cache, erreur), source Hyundai.
- Tests d'intégration existants, inchangés : `__tests__/CarView/MapCard.renault.test.tsx` et `MapCard.hyundai.test.tsx`.
