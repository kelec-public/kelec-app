# Packages `kelec-profile` et `kelec-garage`

L'onglet « Compte » liste les voitures de l'utilisateur. Il permet d'en choisir une par défaut, de les réordonner,
de les renommer, de les supprimer et d'en ajouter une.

- **`kelec-profile`** (feature) : l'écran, avec ses contrôleurs et ses vues.
- **`kelec-garage`** (domaine partagé) : les voitures de l'utilisateur. On y trouve la persistance du compte, les mots de passe,
  le modèle technique de chaque voiture, son image, les actions sur la liste et la déconnexion.
  Ce package est utilisé par Profile, et aussi par `Main` (chargement), la connexion (`kelec-login`), la page voiture,
  l'historique de charge (support V2G), le QuickSwitch et Réglages (déconnexion).

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Invariant

**Un VIN est unique dans toute l'app, et chaque VIN a exactement un compte.** Toutes les actions identifient donc
une voiture par son VIN seul. Par exemple, `GarageService.deleteCar(vin)` retrouve le compte, et donc l'email, à partir du VIN.

## Structure

```
kelec-garage/                         (domaine partagé, importé via index.ts)
├── models/
│   └── userAccountFactory.ts   JSON stocké → UserAccount (RenaultAccount / HyundaiAccount / DemoAccount)
├── services/
│   ├── accountRepository.ts    load / save du compte (clés "account" + "kelecNextGen")
│   ├── passwordVault.ts        Mots de passe dans le stockage chiffré natif (clé <vin>_password)
│   ├── carTypeRepository.ts    Modèle technique de la voiture (<vin>/carType)
│   ├── carImageRepository.ts   Image de la voiture : get / save (+ envoi aux widgets natifs), toImageUri
│   ├── garageService.ts        selectDefaultCar, moveCar, renameCar, deleteCar (modifie le UserAccount + enregistre)
│   └── session.ts              logOut : efface les identifiants du trousseau, tout le stockage local et le compte des widgets
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
2. `useProfileController` appelle `GarageService`, qui modifie le `UserAccount` puis l'enregistre (`AccountRepository.save`).
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
| `account` | `UserAccount` (liste des voitures, voiture par défaut), **sans mot de passe** | `kelec-garage` (`AccountRepository`) |
| `kelecNextGen` | Marqueur de la nouvelle interface d'ajout : sans lui, `load` ignore le compte | `kelec-garage` (`AccountRepository`) |
| `<vin>/carType` | Modèle technique de la voiture (batterie, puissances, V2G…) | `kelec-garage` (`CarTypeRepository`) |
| `<vin>_password` (stockage chiffré natif) | Mot de passe du compte. **Nom à ne pas changer** : lu par les widgets et l'intent Siri | `kelec-garage` (`PasswordVault`) |
| `account` (stockage partagé natif) | Même JSON sans mot de passe, pour les widgets | `kelec-garage` (via `saveNativeAccount`) |

## Enregistrement du compte

`AccountRepository.save(user)` :
1. écrit chaque mot de passe dans le stockage chiffré (`<vin>_password`), en **attendant** la fin de l'écriture ;
2. crée une **copie JSON sans mot de passe** ;
3. envoie cette copie aux widgets (`saveNativeAccount`) et l'enregistre dans AsyncStorage.

Le compte en mémoire n'est pas modifié.

`AccountRepository.load()` reconstruit le compte (`buildUserAccount`) avec les mots de passe du stockage chiffré.
Si un mot de passe n'y est pas encore (anciennes versions, où il était stocké en clair), il est repris depuis le JSON puis le compte est réenregistré (migration).

## Historique du refactor

### PR « account » (persistance du compte)

- `storageHandler.saveAccount` / `loadAccount` / `buildUserAccount` ont été remplacés par `AccountRepository` et `buildUserAccount`,
  `getCarType` / `setCarType` par `CarTypeRepository`, et `logOut` par `logOut` (kelec-garage). `loadCarMaker`, inutilisé, a été supprimé.
- **Correctif de sécurité** : `saveNativeAccount` lançait l'écriture chiffrée des mots de passe dans un `forEach(async …)` non attendu,
  puis écrivait tout de suite le JSON du compte dans le stockage partagé des widgets, qui n'est **pas chiffré**. Ce JSON contenait donc
  les mots de passe en clair, à chaque enregistrement. Désormais, les mots de passe sont écrits (et attendus) dans le stockage chiffré,
  et seule une copie sans mot de passe est envoyée aux widgets. `saveNativeAccount` ne fait plus qu'écrire ce JSON.
  Les JSON déjà présents sur les téléphones sont nettoyés au prochain enregistrement du compte (pas de réécriture forcée au démarrage, choix assumé).
- **Déconnexion** : elle efface maintenant aussi le stockage chiffré de chaque voiture (`<vin>_password`, `jwt_<email>`, `cookieValue_<email>`).
  Avant, ces identifiants restaient dans le trousseau après la déconnexion. Un identifiant introuvable n'empêche pas la déconnexion (`Promise.allSettled`).
- Conséquence visible dans les tests : l'ajout d'une voiture n'entraîne plus qu'un seul enregistrement, au lieu de deux,
  puisque le rechargement trouve directement le mot de passe dans le stockage chiffré et n'a plus rien à migrer.

### PR « profile »

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

- `__tests__/packages/kelec-garage/account.test.ts` :
  - enregistrement : mots de passe dans le stockage chiffré, jamais dans le JSON ni pour les widgets ; compte en mémoire non modifié ;
  - chargement : bon type de compte, mots de passe, migration d'un ancien mot de passe en clair ;
  - `CarTypeRepository` ;
  - `logOut` : identifiants du trousseau effacés pour chaque voiture, et déconnexion effectuée même si un effacement échoue.
- `__tests__/packages/kelec-garage/garage.test.ts` :
  - actions de `GarageService`, dont la suppression : les identifiants sont effacés et les données conservées ;
  - un VIN inconnu ne fait rien ;
  - `CarImageRepository`.
- Tests d'intégration existants : `__tests__/ProfileView/ProfileView.test.tsx` et `RenameCar.test.tsx`.
