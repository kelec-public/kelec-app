# Package `kelec-login`

Parcours d'**ajout d'une voiture** : choix du constructeur → identifiants (→ TFA Renault si besoin) → choix de la voiture → modèle de la voiture → ajout au garage.
C'est aussi l'écran de connexion au premier lancement.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-login/                              (feature)
├── models/
│   ├── loginResult.ts                    LoginResult : ok (compte) | tfa (regToken) | error (clé de traduction)
│   └── carMakers.ts                      constructeurs proposés (noms affichés : CAR_MAKER_DISPLAY)
├── services/
│   ├── createLoginSource.ts              choix de la source selon le constructeur
│   ├── sources/
│   │   ├── renaultLoginSource.ts         Renault / Dacia / Alpine : connexion (Kamereon), voitures, choix de l'image
│   │   ├── hyundaiLoginSource.ts         Hyundai : autorisation, connexion, voitures (PIN fixe HYUNDAI_PIN, en dur volontairement)
│   │   └── demoLoginSource.ts            compte et voitures de démonstration, isDemoCredentials
│   ├── loginErrors.ts                    erreur de connexion → clé de traduction
│   └── vehicleImages.ts                  téléchargement des images des voitures proposées (avec cache)
├── controllers/
│   ├── useAddCarFlow.ts                  état du parcours + confirmation (image, ajout au garage, rechargement)
│   ├── useCredentialsController.ts       identifiants, connexion, erreurs
│   └── useVehicleList.ts                 voitures du compte connecté
├── types/loginSource.ts                  interface LoginSource
└── views/
    ├── LoginEntryView.tsx                navigateur du parcours
    └── Steps/
        ├── Step1/CarMakerSelectView.tsx  constructeur
        ├── Step2/CredentialsView.tsx     identifiants (+ autoremplissage Android)
        └── Step3/SelectACarView.tsx, CarSelector.tsx   choix de la voiture
```

Les autres étapes sont dans leurs propres packages, réutilisés par la page voiture :
- **TFA** : [`kelec-tfa`](./tfa.md), route `TFA_ROUTE` ;
- **modèle de la voiture** (dernière étape) : [`kelec-car-type`](./car-type.md), route `CAR_TYPE_ROUTE`, avec `onConfirmed={flow.confirm}`.

La mise en page commune des étapes est `StepLayout` (kelec-model).

## Connexion

`LoginSource.authenticate(email, password)` renvoie un `LoginResult`. Le compte démo (`kelec-demo@gmail.com` / `demo`) est détecté
avant le choix de la source, quel que soit le constructeur sélectionné. Selon le résultat :
- `ok` : le compte est gardé dans le parcours, et on passe au choix de la voiture ;
- `tfa` : navigation vers `TFA_ROUTE`, puis retour à l'écran des identifiants pour se reconnecter ;
- `error` : une alerte avec le message traduit.

## Confirmation de l'ajout

`useAddCarFlow().confirm()` :
1. enregistre l'image de la voiture **choisie** (`CarImageRepository`). Elle est prise dans le cache si elle a déjà été affichée à l'étape 3 ;
2. associe la voiture au compte et l'ajoute au garage (`GarageService.addCar`, qui enregistre le compte) ;
3. recharge l'utilisateur (`reloadUser`).

Avant, les images de **toutes** les voitures listées étaient enregistrées dès l'affichage de la liste, y compris celles qu'on n'ajoutait pas.

## Un VIN ne peut être ajouté qu'une fois

Un VIN est unique dans toute l'app (voir `CLAUDE.md`) :
- **étape 3** : `useVehicleList` retire de la liste les voitures déjà dans le garage (`GarageService.hasCar`) ;
- si la liste est vide (toutes les voitures déjà ajoutées, ou compte sans voiture), un message générique s'affiche :
  clé `noVehicleToAdd`, `testID="noCarToAdd"` ;
- **garde-fou** : `GarageService.addCar` renvoie `false` et n'ajoute rien si le VIN est déjà présent.

## Historique du refactor

1. **UI** : `LoginDefaultView` est devenu `StepLayout` (kelec-model), avec des textes déjà traduits et `onDismiss`.
   Les cartes leasing et V2G utilisent `SwitchCard`.
2. **TFA** : sorti dans `kelec-tfa`.
3. **Modèle de la voiture** : sorti dans `kelec-car-type`. Ses paramètres de route sont devenus sérialisables.
4. **MVC** : les sources par constructeur, les contrôleurs et `GarageService.addCar` remplacent la logique qui était dans les vues
   (deux `switch` Renault / Hyundai / démo, correspondance des erreurs, choix de l'image, ajout au compte).
   Les erreurs de la liste Hyundai sont maintenant gérées (écran d'erreur au lieu d'une exception non traitée).
   `loadCarModel` a été retiré de `CarViewContext`, car il n'était plus utilisé.

## Tests

- `__tests__/packages/kelec-login/loginServices.test.ts` : constructeurs proposés, identifiants démo, choix de la source,
  messages d'erreur, choix de l'image Renault, connexion Renault (succès, TFA, erreur), voitures démo.
- `__tests__/packages/kelec-login/vehicleImages.test.ts` : cache des images, sans mettre les échecs en cache.
- `__tests__/packages/kelec-login/SelectACarView.test.tsx` : voitures déjà ajoutées masquées, message quand il ne reste rien à ajouter.
- `__tests__/packages/kelec-garage/garage.test.ts` : `addCar` refuse un VIN déjà présent.
- Tests d'intégration : `__tests__/AddView/*` (mis à jour : les images ne sont plus enregistrées à l'affichage de la liste,
  seule celle de la voiture ajoutée l'est), `__tests__/Login/*`, `CarView/DemoAccount.test.tsx`.
