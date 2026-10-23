# Mode démo

Compte de démonstration, utilisé en particulier pour la review Apple : il doit permettre d'essayer **toutes les features**
sans voiture ni compte constructeur. Aucune requête n'est envoyée à un constructeur.

## Connexion

Identifiants `kelec-demo@gmail.com` / `demo` (sans tenir compte de la casse), avec **n'importe quel constructeur** choisi
à la première étape (`isDemoCredentials`, voir [login.md](./login.md)). Le compte proposé contient trois voitures,
de constructeur `CarMaker.DEMO`. Après le choix d'une voiture, le modèle (marque, modèle, batterie) est choisi comme pour
une vraie voiture.

## Les trois voitures

| VIN | Nom | Ce qu'elle montre |
|---|---|---|
| `VF1AA` | Demo car | En charge (AC) : barre verte, puissance, temps restant, heure de fin, limite de charge. Historique de 8 charges, dont une en DC. |
| `VF1AA2` | Demo V2G | En V2G : statut et barre orange. Historique avec 3 charges et 4 sessions V2G (énergie chargée / renvoyée au réseau). |
| `VF1AA3` | Demo PHEV | Hybride rechargeable : carburant (28 l), autonomie thermique et totale. Branchée, charge programmée chaque soir (« Prochaine charge »). Déverrouillée dans les widgets iOS et le raccourci Siri. |

Un VIN inconnu (ex. voiture démo ajoutée avant ces trois profils) reçoit les données de `VF1AA`.

Le statut batterie, la programmation de charge et la position sont **datés de maintenant** à chaque lecture :
la démo est toujours « à jour ». Les dates de l'historique de charge, elles, sont fixes (2023-2024).

## Où sont les données

Les valeurs sont copiées à trois endroits, **à garder identiques** (mêmes VIN, niveaux, autonomies, états de charge,
kilométrages, positions) :

| Plateforme | Fichier | Utilisé par |
|---|---|---|
| App RN | `src/assets/car_data/mockDemoData.json` (par VIN, au format de l'API Renault), lu via `demoCarData(vin)` (`src/lib/clients/accounts/demoCars.ts`) | `DemoCarLoader` (page voiture), `DemoChargesSource` (historique), `DemoLocationSource` (carte, météo), `DemoLoginSource` (VIN proposés) |
| iOS | `ios/Packages/RenaultApi/Sources/renaultApi/demo/demoCar.swift` (`DemoCar`), lu par `DemoApiHandler(vin:)` | Widgets, Apple Watch et ses widgets, intents Siri, contrôle « confort thermique » |
| Android | `android/carapi/src/main/kotlin/com/kelec/carapi/DemoCar.kt`, lu par `BatteryStatus.demo(vin)` | Widgets, app Wear OS et complication (`VehicleLoader`, `VehicleCommands`) |

Les sessions V2G du mock sont au format brut de l'API (`V2GApiSession`) et passent par `Charge.fromV2GSessions`,
comme pour une vraie voiture. Le natif enregistre aussi le kilométrage de la démo (historique de kilométrage, Réglages → Debug).

## Comportements propres à la démo

- **Import de charges** : les charges importées sont gardées **en mémoire**, par VIN, et perdues au redémarrage de l'app.
  Une charge déjà présente l'emporte sur celle importée, comme pour une vraie voiture.
- **Confort thermique** : le lancement réussit toujours (app, montre, Siri, widgets). Il n'y a pas de statut
  (`CommandOnlyHvacSource`, voir [hvac.md](./hvac.md)).
- **Rafraîchissement** : pas de réseau, les données ne changent pas (sauf la date de mise à jour).
- **Pas d'affichage hybride dans les widgets** : les widgets n'affichent ni carburant ni autonomie thermique,
  quelle que soit la voiture.
- **Pas de TFA** : le parcours TFA Renault ne peut pas être montré avec la démo.

## Checklist pour la review

Ajouter les trois voitures, puis :

- **Page voiture** : `VF1AA` (charge en cours), `VF1AA2` (V2G), `VF1AA3` (hybride, prochaine charge) ; carte et météo ;
  confort thermique.
- **Limite de charge** : la barre de limite n'est affichée que pour les modèles qui la gèrent
  (`shouldDisplayChargingLimit`) : choisir un tel modèle dans « Modèle de la voiture ».
- **Historique de charge** (`VF1AA2` pour le V2G) : mois, filtres, export.
- **Coût des charges** : créer un tarif (le premier s'applique à toutes les dates), modifier le prix d'une charge.
  Les sessions V2G n'ont pas de coût, sauf prix saisi.
- **Import** : importer un fichier, les charges apparaissent jusqu'au redémarrage.
- **Modèle de la voiture** : interrupteur V2G, leasing (kilométrage au-dessus / en dessous), limite de charge.
- **Compte** : renommer, réordonner, supprimer une voiture ; plaque d'immatriculation.
- **Natif** : widgets iOS (petit, moyen, écran verrouillé, Tempo), Spotlight / Quick Actions, Siri, Apple Watch
  (Réglages → « Synchroniser avec l'Apple Watch ») ; widgets Android (2x2, 4x2, Tempo), raccourcis, Wear OS et complication.

## Tests

- `__tests__/packages/demoSources.test.ts` : état de chaque voiture, VIN inconnu, données datées de maintenant,
  sessions V2G, import en mémoire, position.
- `__tests__/CarView/DemoAccount.test.tsx` : connexion démo de bout en bout, trois voitures proposées, confort thermique.
- `__tests__/packages/kelec-login/loginServices.test.ts` : identifiants démo, VIN proposés.
- `android/carapi/src/test/kotlin/com/kelec/carapi/DemoCarTest.kt` : état de charge par VIN, VIN inconnu, date.
