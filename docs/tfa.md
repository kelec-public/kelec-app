# Package `kelec-tfa`

Écran de vérification en deux étapes (TFA) Renault. Il est déclenché :
- **à l'ajout d'une voiture** (`kelec-login`), quand la connexion renvoie `PENDING_TFA` ;
- **depuis la page voiture** (`CarView`), quand le fetch batterie renvoie `PENDING_TFA`.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-tfa/                         (feature, importée via index.ts)
├── services/tfaSequence.ts        startTfa (appareil → séquence → emails → envoi du code), validateTfa (code → finalisations)
├── controllers/useTfaFlow.ts      état (chargement / saisie / erreur), code, renvoi avec délai (10 s), validation et alertes
├── views/TfaView.tsx              écran (StepLayout)
├── views/TfaCodeView.tsx          saisie du code à 6 chiffres
├── routes.ts                      TFA_ROUTE, TfaRouteParams
└── index.ts
```

Le client HTTP (`RenaultTfaClient`) reste dans `src/lib/clients/carMakers/renault`.

## Utilisation

Chaque navigateur qui peut déclencher le TFA enregistre l'écran sous `TFA_ROUTE`, puis navigue avec :

```ts
navigation.navigate(TFA_ROUTE, { regToken, successMessageKey: 'pullToRefreshCarData' });
```

- `successMessageKey` : clé de traduction du message affiché une fois le TFA validé. Elle remplace l'ancien `TfaOrigin` :
  le TFA n'a plus à connaître ses appelants, et le paramètre reste sérialisable pour React Navigation.
- `onTfaCompleted` (prop de l'écran, optionnelle) : appelé en quittant l'écran, que ce soit après un succès, trop d'essais ou un retour.
  La page voiture s'en sert pour relâcher son verrou « TFA en cours ».

## Historique du refactor

- `kelec-login/views/Steps/Step2/Tfa/` a été déplacé dans `kelec-tfa` (avec `git mv`). La logique de l'écran est passée dans `useTfaFlow` et `tfaSequence`.
- La page voiture n'importe plus de fichier interne de `kelec-login`.
- `TfaOrigin` a été remplacé par `successMessageKey`.

## Tests

- `__tests__/packages/kelec-tfa/tfaSequence.test.ts` : ordre des appels, et arrêt de la suite si une étape échoue.
- Tests d'intégration existants : `__tests__/Login/TfaView.test.tsx`, `AddView/AddView.renault.test.tsx` (TFA pendant l'ajout), `CarView/SummaryCard.renault.test.tsx` (TFA depuis la page voiture).
