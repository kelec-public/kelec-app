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
- **Voitures ajoutées avant ce champ** : pas de pays, la plaque reste brute (jusqu'à ce que la voiture soit ajoutée à nouveau).

`registrationCountry` est un champ optionnel du JSON de la voiture (AsyncStorage `account` et widgets) : les widgets iOS / Android l'ignorent.
