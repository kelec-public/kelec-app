# Plaques d'immatriculation (`kelec-licence-plate`)

Package de domaine partagé : il écrit une plaque selon les règles de son pays d'immatriculation.
Utilisé par `kelec-profile` (`CarRow`) et `kelec-login` (`CarSelector`).

## API

`formatLicencePlate(plate, country?)` (fonction pure, `services/formatLicencePlate.ts`) :

- `country` est un code ISO 3166-1 alpha-2 (`"FR"`, `"GB"`…) ;
- la plaque est d'abord normalisée (majuscules, sans espaces ni tirets), puis comparée aux formats du pays (`models/plateFormats.ts`) ;
- sans pays, pour un pays non géré ou si aucun format ne correspond, la plaque est renvoyée **telle quelle**.

## Pays gérés

Les 27 pays de l'UE sauf ceux où la plaque brute ne suffit pas à savoir où couper, plus le Royaume-Uni :

- non gérés : Allemagne, Autriche, Pologne (longueur du code de ville variable), Slovaquie (ancien et nouveau formats identiques sans séparateurs), Slovénie (place du tiret variable) ;
- Pays-Bas : les « sidecodes » sont gérés par une règle à part (coupure entre lettres et chiffres, un groupe de 4 coupé en 2 + 2) ;
- France : seulement le format SIV (`AB-123-CD`), pas l'ancien FNI.

## D'où vient le pays

- **Renault / Dacia / Alpine** : `vehicleDetails.registrationCountry.code` de la réponse `/vehicles` (Kamereon), lu à l'ajout de la voiture
  (`renaultLoginSource`) et enregistré dans `CarModel.registrationCountry`. C'est le pays d'immatriculation de la voiture,
  différent du pays du compte (ex. une voiture `GB` sur un compte `FR`).
- **Hyundai** : pas de pays, la plaque reste brute.
- **Voitures ajoutées avant ce champ** : rattrapage (`retrofitRegistrationCountry`, kelec-garage), lancé par `CarView`
  dans `onNetworkLoaded`, donc seulement après un fetch batterie réussi (pas pendant un TFA ou une erreur d'authentification).
  - Il rappelle `/vehicles` et enregistre le pays de la voiture, en mémoire et dans le compte.
  - **Une seule fois par voiture** : dès que l'API a répondu, le marqueur `<vin>/registrationCountryRetrofit` est posé,
    même si la voiture n'est plus dans la liste (supprimée du compte constructeur) ou n'a pas de pays.
  - **En cas d'échec** (réseau, identifiants…), rien n'est écrit, ni pays ni marqueur : on réessaie au prochain chargement réussi.
  - Le compte est relu juste avant l'écriture, et les écritures passent l'une après l'autre : une voiture supprimée ou renommée
    pendant l'appel n'est pas écrasée, et les voitures du pager rattrapées en parallèle ne perdent pas leur pays.

`registrationCountry` est un champ optionnel du JSON de la voiture (AsyncStorage `account` et widgets) : les widgets iOS / Android l'ignorent.
