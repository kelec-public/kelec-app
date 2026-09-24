# Pattern des packages (`src/packages`)

Ce document décrit comment une fonctionnalité est découpée en package dans l'app.
Il sert de référence pour les refactors en cours et à venir. Exemples concrets :

- [Historique de charge](./charge-history.md) (`kelec-charge-history`)
- [Climatisation / préchauffage](./hvac.md) (`kelec-hvac`)
- [Page compte et garage](./profile.md) (`kelec-profile`, `kelec-garage`)
- [Réglages et préférences](./settings.md) (`kelec-settings`, `kelec-preferences`)

## Objectifs

- **Une fonctionnalité = un package** qui contient tout ce qui la concerne : modèle, accès aux données, état de l'écran et vues.
- **Séparer les responsabilités (MVC)** : les vues affichent, les contrôleurs gèrent l'état, les modèles et services portent la logique et les données.
- **Sortir les fonctionnalités de l'`ApiHandler`**, qui ne doit plus garder que le statut batterie / voiture.
- **Rendre les dépendances explicites** : aucun couplage caché via une clé de stockage ou une chaîne de caractères partagée.
- **Avancer petit à petit** : un package par PR, sans changement de comportement non voulu, avec les tests existants qui passent sans modification (mêmes `testID`).

## Les types de packages

| Type | Packages | Rôle |
|---|---|---|
| **Infrastructure** | `kelec-model` (composants UI, couleurs, polices), `kelec-storage` (accès AsyncStorage) | Briques techniques réutilisables, sans aucune logique métier. |
| **Domaine partagé** | `kelec-garage` (les voitures de l'utilisateur : compte, mots de passe, modèle technique, image, actions sur la liste), `kelec-preferences` (préférences de l'app) | Données et logique métier utilisées par plusieurs features. Exposées uniquement via `index.ts`. |
| **Feature** | `kelec-car-page`, `kelec-login`, `kelec-charge-history`, `kelec-hvac`, `kelec-profile`, `kelec-settings` | Une fonctionnalité de l'app. |

Une donnée qui n'est utilisée que par une feature reste dans cette feature. Elle passe dans un package de domaine partagé
quand plusieurs features doivent la lire ou l'écrire (ex. l'image de la voiture : écrite par `kelec-login`, lue par la page voiture, le QuickSwitch et Profile).

## Structure d'un package feature

```
kelec-<feature>/
├── models/        Données métier (classes / types) et règles simples qui en découlent
├── services/      Logique pure, persistance, accès aux API
│   └── sources/   Une implémentation par constructeur (Renault, Hyundai, Démo…)
├── controllers/   Hooks React et Providers : état, actions, effets de bord (alertes, modales)
├── views/         Composants d'affichage, pilotés par les contrôleurs
├── types/         Interfaces partagées dans le package (ex. la source)
├── routes.ts      (si besoin) noms des routes de navigation exposées
└── index.ts       (si besoin) API publique pour les autres features
```

### Models

- Classes ou types qui représentent les données (`Charge`, `ChargesHistory`, `HvacStatus`…).
- Méthodes « métier » simples sur ces données (`charge.isDCCharge()`, `status.isBelowMinimumSoc(level)`).
- Pas de React, pas de stockage, pas de réseau.
- Les constantes métier sont définies à un seul endroit (ex. `Charge.DC_THRESHOLD_KW = 26`).

### Services

- **Fonctions pures** (filtres, regroupements, calculs), faciles à tester unitairement.
- **Repositories / préférences** : lecture et écriture locales, en s'appuyant sur `kelec-storage`.
- **Sources** : l'accès aux données propre à chaque constructeur, derrière une interface commune (voir plus bas).
- Pas de React.

### Controllers

- **Provider + hook** (`XxxProvider` / `useXxx()`) : l'état partagé de la fonctionnalité pour une voiture (données, `sync`, commandes).
  Seulement pour les features qui ont des données par voiture venant du réseau. Une feature purement locale (ex. `kelec-profile`) n'a ni source ni Provider.
- **Hooks d'écran ou de carte** (`useXxxController`) : l'état local de l'UI (modales, champs, chargement), les actions, les alertes.
- Ils lisent les contextes globaux (`MainContext`, `CarsViewContext`, `CarViewContext`) dont les vues ont besoin.

### Views

- Des composants qui reçoivent leurs données et leurs callbacks d'un contrôleur (en props ou via le hook).
- On peut y garder un état purement visuel (section dépliée, animation).
- On garde les **mêmes `testID`** que l'ancien code, pour que les tests d'intégration restent valides.

## Le pattern « source » (par constructeur)

Chaque constructeur expose ses données différemment. Une interface commune isole ces différences :

```ts
interface XxxSource {
    loadCached(): Promise<T | null>;        // lecture locale, instantanée
    syncFromNetwork(): Promise<T | null>;   // API + enregistrement ; null si indisponible
    // + éventuelles commandes (ex. launch(temperature))
}
```

Une factory `createXxxSource(carModel, account, …)` choisit l'implémentation selon `carModel.getCarmaker()`,
comme `createCarLoader` dans `kelec-car-page`. Si le constructeur ne gère pas la fonctionnalité, elle renvoie `null`
(ou une source « vide » quand l'UI doit quand même s'afficher).

Les appels HTTP restent sur les classes `Account` / `*Client` dans `src/lib/clients`. La source les appelle, elle ne les remplace pas.

## Cycle de chargement : cache puis réseau

Le Provider de chaque feature est monté **par voiture** dans `CarsPageView`, autour du `NavigationContainer`,
pour que tous les écrans de la voiture (page voiture, écran de détail…) lisent la même donnée.

1. **Au montage**, le Provider appelle `source.loadCached()` et affiche tout de suite ce qu'il y a en local.
2. **Le réseau n'est lancé qu'après un fetch batterie réussi.** `useCarData` (dans `kelec-car-page`) appelle `onNetworkLoaded` quand le loader renvoie `ok`.
   `CarView` y branche le `sync()` de chaque feature (`Promise.all`). Ainsi :
   - on n'appelle pas les API pendant un TFA ou une erreur d'authentification ;
   - le pull-to-refresh rafraîchit tout, et l'indicateur reste affiché jusqu'à la fin des synchros.
3. **Le cache ne doit pas écraser le réseau** : si la réponse réseau arrive avant la lecture du cache, la valeur du cache est ignorée (`hasNetworkData`).
4. Les `setState` après démontage sont ignorés (`isMounted`).

> `ChargesHistoryProvider` et `HvacProvider` partagent cette logique, volontairement dupliquée pour l'instant.
> Si un troisième package en a besoin, on l'extraira dans un hook générique.

## Stockage : `kelec-storage`

- `VinStorage` : `get/set` de chaînes ou de JSON sous la clé `<vin>/<clé>`.
- `AppStorage` : `get/set` JSON pour les données globales de l'app (non liées à une voiture), ex. `appPreferences`.
- `BatchedList<T>` : une liste stockée par lots (`<name>Amount` et `<name>Index<i>`), avec relecture puis suppression d'un ancien format (`legacyKey`).
- **Les repositories restent dans les features** : `kelec-storage` ne sait pas ce qu'est une `Charge` ou un `HvacStatus`.
- Chaque clé appartient à **un seul** package, qui est le seul à la lire et à l'écrire.
- Les clés propres à une voiture suivent le format `<vin>/<clé>`.

La migration de `src/lib/storage/storageHandler` se fait par petites étapes, en envoyant chaque partie vers le package qui possède la donnée :

| Aujourd'hui dans `storageHandler` | Destination | Statut |
|---|---|---|
| `storeImage` + lecture `<vin>/image` | `kelec-garage` (`CarImageRepository`) | ✅ fait |
| `saveAccount` / `loadAccount` (UserAccount) | `kelec-garage` (`AccountRepository`) | ✅ fait |
| `getCarType` / `setCarType` | `kelec-garage` (`CarTypeRepository`) | ✅ fait |
| `storeApiData` / `getStoredApiData`, `buildApiHandler` | `kelec-car-page` (à côté de `CarStatusCache`) | à faire |
| `getAppPreferences` / `setAppPreferences` | `kelec-preferences` (`PreferencesRepository`) | ✅ fait |
| onboarding (`get/setHasSeenOnboarding`) | à décider | à faire |
| `logOut` | `kelec-garage` (`logOut`) | ✅ fait |
| `loadCarMaker` | — (inutilisé) | ✅ supprimé |

## Règles de dépendances

```
screens (src/screen)  ──►  features  ──►  domaine partagé  ──►  infrastructure
                                 │                │
                                 └────────────────┴──►  src/lib (clients, contexts, utils)
```

1. **L'infrastructure ne dépend ni du domaine ni des features** : `kelec-storage` et `kelec-model` n'importent jamais `kelec-garage`, `kelec-hvac`, etc.
2. **Le domaine partagé ne dépend d'aucune feature** : `kelec-garage` n'importe jamais `kelec-profile`, `kelec-car-page`, etc.
3. **Un package de domaine ou une autre feature ne s'importe que via son `index.ts`**, jamais un fichier interne.
   Ex. : `import { CarImageRepository } from "../../kelec-garage"`, ou `kelec-hvac` qui lit le statut Hyundai via `import { CarStatusCache } from "../../../kelec-car-page"`.
4. **Pas de couplage par chaîne de caractères** entre modules :
   - une donnée stockée est lue par le module qui l'écrit, et exposée via une fonction typée (`CarStatusCache`) ;
   - un nom de route est exporté par le package qui fournit l'écran (`CHARGES_HISTORY_ROUTE`), et `CarsPageView` s'en sert.
5. **Pas de cycle.**
6. **L'assemblage se fait dans les screens** (`CarsPageView`, `CarView`) : ce sont eux qui montent les Providers et relient `onNetworkLoaded` aux `sync()`.
   `kelec-car-page` ne connaît pas les autres features.

Les règles 1 à 3 sont écrites dans `.eslintrc.js` (`no-restricted-imports`, configurée par package).
**Elles ne sont pas encore vérifiées automatiquement** : la CI ne lance que jest, et le repo a encore des erreurs ESLint plus anciennes.
Pour l'instant, on les vérifie avec `npm run lint` ou dans l'éditeur.

## Tests

- **Tests unitaires** sur les modèles et services purs : `__tests__/packages/<package>/`.
- **Tests d'intégration** existants (rendu de `<App />` avec des clients mockés) : ils doivent passer sans modification, d'où l'importance de garder les `testID`.
- Pour une règle qui touche au réseau (ex. « pas de fetch si la batterie est en erreur »), on écrit un test et on vérifie qu'il échoue bien si on casse la règle.

## Checklist pour migrer une fonctionnalité

1. Lister le code existant : vues, méthodes de l'`ApiHandler`, entrées dans les car loaders, clés de stockage, tests qui en dépendent.
2. Créer `src/packages/kelec-<feature>/` avec `models / services / controllers / views`.
3. Si la feature a des données réseau par voiture : écrire les sources par constructeur et la factory.
4. Idem : écrire le Provider (cache puis `sync`), le monter dans `CarsPageView`, brancher `sync` dans le `onNetworkLoaded` de `CarView`.
   Si une donnée est partagée entre plusieurs features, la mettre dans un package de domaine partagé.
5. Déplacer les vues en gardant les `testID` et en les branchant sur les contrôleurs.
6. Supprimer l'ancien code : méthodes de l'`ApiHandler` et de ses implémentations, slots des car loaders, anciens fichiers.
7. Garder les clés de stockage existantes (ou décider explicitement d'une migration, en acceptant de perdre les anciennes valeurs).
8. Vérifier : `tsc` (aucune nouvelle erreur), toute la suite jest, `eslint src/packages`.
9. Documenter le package dans `docs/`.
