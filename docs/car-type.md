# Package `kelec-car-type`

Formulaire du **modèle technique** d'une voiture : marque, modèle, batterie, limite de charge, leasing et V2G.
Il est ouvert :
- **à l'ajout d'une voiture** (`kelec-login`), comme dernière étape ;
- **depuis la page voiture** (bouton réglages de la carte résumé), pour modifier le modèle.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-car-type/                        (feature, importée via index.ts)
├── models/carTypeForm.ts              CarTypeForm, options des menus (marque / modèle / batterie), validité,
│                                      limite de charge disponible, conversions formulaire ⇄ CarType
├── services/carCatalog.ts             catalogue de l'API Kelec (marques, modèles, batteries) → options
├── controllers/useCarTypeForm.ts      état du formulaire, pré-remplissage, enchaînement des choix, enregistrement
├── views/
│   ├── CarTypeScreen.tsx              écran (StepLayout)
│   ├── AsyncDropDown.tsx              menu déroulant à options chargées de façon asynchrone
│   ├── ChargeLimitSlider.tsx          limite de charge
│   └── LeasingCard.tsx                leasing (SwitchCard + champs du contrat)
├── routes.ts                          CAR_TYPE_ROUTE, CarTypeRouteParams
└── index.ts
```

L'enregistrement passe par `CarTypeRepository` (kelec-garage), sous la clé `<vin>/carType`.

## Utilisation

Chaque navigateur enregistre l'écran sous `CAR_TYPE_ROUTE` **et fournit l'action de fin** (`onConfirmed`) :

```tsx
<Stack.Screen name={CAR_TYPE_ROUTE}>
  {props => <CarTypeScreen {...props} onConfirmed={onConfirmCarAdd} />}
</Stack.Screen>
```

puis navigue avec des paramètres **sérialisables** :

```ts
navigation.navigate(CAR_TYPE_ROUTE, { vin, imageUrl, titleKey: 'carModel', nextButtonTextKey: 'confirm' });
```

| Appelant | `onConfirmed` |
|---|---|
| Ajout de voiture (`LoginEntryView`) | ajoute la voiture au compte (`onConfirmCarAdd`) |
| Page voiture (`CarsPageView`) | `navigation.goBack()`. `CarView` relit l'image et le modèle enregistrés quand il reprend le focus (`useFocusEffect`) |

## Règles

- **Obligatoire** : marque, modèle et batterie. Si « leasing » est activé : dates de début et de fin, et kilométrage total.
  Une validation incomplète met les champs manquants en rouge.
- **Choix en cascade** : changer de marque vide le modèle et la batterie ; changer de modèle vide la batterie.
- **Limite de charge** : proposée seulement pour les modèles de `AUTHORISED_MODELS` (voir `CarType`).

## Historique du refactor

- `kelec-login/views/Steps/Step4/` a été déplacé dans `kelec-car-type` (avec `git mv`) :
  `CarModelSelector` → `CarTypeScreen`, `CarModelChoiceLeasing` → `LeasingCard`, `DropDownView` → `AsyncDropDown`.
- **Paramètres de route rendus sérialisables** : il n'y a plus d'objet `CarModel` (on passe `vin` et `imageUrl`)
  ni de callback `onConfirmUpdate` dans les paramètres (il devient la prop `onConfirmed` de l'écran).
- La page voiture n'importe plus de fichier interne de `kelec-login`.
- Au passage (PR précédente) : le style du lien « Ma voiture n'est pas listée » est corrigé.

## Tests

- `__tests__/packages/kelec-car-type/carTypeForm.test.ts` : libellé de batterie, validité, limite de charge,
  aller-retour formulaire ⇄ CarType, enchaînement des choix, formulaire incomplet non enregistré, pré-remplissage puis enregistrement.
- Tests d'intégration existants : `__tests__/CarView/CarModelChoiceStep.test.tsx`, `CarModelChoiceStep/CarModelChoiceLeasing.test.tsx`, `AddView/*`.
