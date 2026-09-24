# Packages `kelec-profile` et `kelec-garage`

L'onglet « Compte » liste les voitures de l'utilisateur. Il permet d'en choisir une par défaut, de les réordonner,
de les renommer, de les supprimer et d'en ajouter une.

- **`kelec-profile`** (feature) : l'écran, avec ses contrôleurs et ses vues.
- **`kelec-garage`** (domaine partagé) : les voitures de l'utilisateur. On y trouve l'image de chaque voiture et les actions sur la liste.
  Ce package est utilisé par Profile, et aussi par la connexion (`kelec-login`), la page voiture et le QuickSwitch.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Invariant

**Un VIN est unique dans toute l'app, et chaque VIN a exactement un compte.** Toutes les actions identifient donc
une voiture par son VIN seul. Par exemple, `GarageService.deleteCar(vin)` retrouve le compte, et donc l'email, à partir du VIN.

## Structure

```
kelec-garage/                         (domaine partagé, importé via index.ts)
├── services/
│   ├── carImageRepository.ts   Image de la voiture : get / save (+ envoi aux widgets natifs), toImageUri
│   └── garageService.ts        selectDefaultCar, moveCar, renameCar, deleteCar (modifie le UserAccount + enregistre)
├── controllers/
│   └── useCarImage.ts          Hook : image d'une voiture
└── index.ts

kelec-profile/                        (feature)
├── controllers/
│   ├── useProfileController.ts Liste des voitures, mode édition, actions (+ reloadUser), confirmation de suppression
│   └── useShakeAnimation.ts    Tremblement des cartes en mode édition
└── views/
    ├── ProfileView.tsx         Écran (onglet « Compte »)
    ├── ProfileHeader.tsx       Titre + boutons (édition / ajout, ou « Ajouter une voiture » s'il n'y a qu'une voiture)
    ├── CarRow.tsx              Une voiture : logo, nom, plaque ou VIN, image, sélection par défaut, actions
    ├── CarRowAction.tsx        Bouton icône + libellé (et emplacement vide pour garder l'alignement)
    ├── RenameCarDialog.tsx     Boîte de dialogue de renommage
    └── DefaultCarNotice.tsx    « <voiture> est sélectionnée par défaut »
```

Il n'y a ni source ni Provider : Profile ne fait aucun appel réseau et ne dépend pas du constructeur.
Le modèle `UserAccount` reste dans `src/lib`, parce qu'il est utilisé dans toute l'app.

## Flux d'une action

1. La vue appelle le contrôleur (ex. `controller.moveCar(vin, MoveDirection.UP)`).
2. `useProfileController` appelle `GarageService`, qui modifie le `UserAccount` puis l'enregistre (`storageHandler.saveAccount`).
3. Le contrôleur appelle ensuite `reloadUser()` (`MainContext`) pour mettre toute l'app à jour.

La suppression passe d'abord par une alerte de confirmation. Les boutons sont dans l'ordre [annuler, confirmer], et les tests s'appuient sur cet ordre.

## Suppression d'une voiture

- Les identifiants enregistrés pour l'email du compte sont effacés (`RenaultCredentials.clearCredentials`), puis la voiture est retirée.
  Si c'était la voiture par défaut, la première voiture restante le devient.
- **Les données locales de la voiture sont volontairement conservées** : historique de charge, image, caches…
  Elles sont réutilisées si la voiture est réimportée. Il ne faut pas les « nettoyer ».

## Stockage

| Clé | Contenu | Propriétaire |
|---|---|---|
| `<vin>/image` | Image de la voiture (base64 JPEG), aussi envoyée aux widgets natifs | `kelec-garage` (`CarImageRepository`) |
| `account` | `UserAccount` (liste des voitures, voiture par défaut) | encore `storageHandler`, à migrer vers `kelec-garage` |

## Historique du refactor

- `screen/loggedIn/ProfileTab/` (`ProfileView`, `CarRow`, `RenameModal`) a été déplacé dans `kelec-profile`.
  La logique métier (5 fois `currentUser.xxx()` + `saveAccount` + `reloadUser` dans les vues) est passée dans `GarageService` et `useProfileController`.
- **Image** : `storageHandler.storeImage` a été remplacé par `CarImageRepository`. La clé `<vin>/image`, qui était lue en dur à 3 endroits
  (`CarRow`, `QuickSwitchElementView`, `useCarProfile`), n'est plus accessible que via `kelec-garage`. C'est la première étape de la migration de `storageHandler`.
- `MoveDirection` était défini deux fois (`account.tsx` et `userAccount.tsx`) : il n'en reste qu'un, dans `account.tsx`.
- L'erreur TypeScript de `ProfileView.tsx` (`account.car` pouvant être `undefined`) est corrigée : les comptes sans voiture sont ignorés.
- **Animation de tremblement** : l'animation en cours était gardée dans une variable locale recréée à chaque rendu, donc jamais arrêtée
  proprement. Elle est maintenant gérée dans un effet avec nettoyage (`useShakeAnimation`).
- **Renommage** : la boîte de dialogue repart du nom actuel à chaque ouverture. Avant, elle gardait le texte saisi puis annulé.

## Tests

- `__tests__/packages/kelec-garage/garage.test.ts` :
  - actions de `GarageService`, dont la suppression : les identifiants sont effacés et les données conservées ;
  - un VIN inconnu ne fait rien ;
  - `CarImageRepository`.
- Tests d'intégration existants : `__tests__/ProfileView/ProfileView.test.tsx` et `RenameCar.test.tsx`.
