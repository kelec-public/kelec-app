# Package `kelec-hvac`

Climatisation / préchauffage : carte sur la page voiture (animée quand la climatisation tourne),
choix de la température, avertissement de SOC minimum, envoi des commandes de lancement et d'arrêt.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-hvac/
├── models/
│   ├── HvacStatus.ts        isRunning, minimumSoc (null si inconnu), isBelowMinimumSoc(level)
│   ├── Temperature.ts       Plage 17–27 °C, défaut 21, libellés LOW / HIGH, stepTemperature
│   └── hvacStopActions.ts   Renault : actions d'arrêt à essayer (« stop » / « cancel ») selon le modèle
├── services/
│   ├── temperaturePreferences.ts   Dernière température choisie, par voiture
│   ├── createHvacSource.ts         Choix de la source selon le constructeur
│   └── sources/
│       ├── commandOnlyHvacSource.ts   Lancement seul, pas de statut ni d'arrêt (Démo ; classe de base)
│       ├── renaultHvacSource.ts       Renault / Dacia / Alpine : statut via l'API HVAC + cache, arrêt
│       └── hyundaiHvacSource.ts       Hyundai : statut lu dans la réponse de statut de la voiture
├── controllers/
│   ├── HvacProvider.tsx           Statut partagé d'une voiture : useHvac() → { status, sync, launch, canStop, stop }
│   └── useHvacCardController.ts   Température, feuille de lancement, envoi, arrêt, alertes
├── views/
│   ├── HvacCard.tsx          Carte de la page voiture (+ animations « en cours »)
│   ├── HvacSheet.tsx         Feuille de lancement (+ bouton d'arrêt quand la climatisation tourne)
│   ├── TemperaturePicker.tsx Boutons − / + et température affichée
│   ├── MinSocWarning.tsx     Avertissement batterie sous le minimum requis
│   └── temperatureStyle.ts   Couleurs (bleu LOW, rouge HIGH) et affichage de l'unité
└── types/hvacSource.ts       Interface HvacSource
```

## Flux de données

1. `HvacProvider` est monté par voiture dans `CarsPageView`, à côté de `ChargesHistoryProvider`.
2. Au montage : `source.loadCachedStatus()`.
3. Après un fetch batterie réussi, `CarView` appelle `sync()` dans le même `onNetworkLoaded` que les charges.
4. `HvacCard` lit le statut via `useHvacCardController` → `useHvac()`. Le niveau de batterie de l'avertissement vient de `CarViewContext` (`apiHandler.getBatteryLevel()`).
5. Lancement : `launch(temperature)` → `account.launchHVAC(temperature)`. En cas de succès, une alerte s'affiche et la feuille se ferme ; sinon, une alerte d'erreur s'affiche et la feuille reste ouverte.
   Le statut **n'est pas** mis à jour de façon optimiste après un lancement : la carte passe en « actif » au prochain fetch.
6. Arrêt : quand la climatisation tourne (`status.isRunning`) et que la source le permet (`canStop`), la feuille affiche
   un bouton d'arrêt (`stopButton`) sous le bouton de lancement. `stop()` → `account.stopHVAC(vin, action)`.
   Mêmes alertes et même absence de mise à jour optimiste que pour le lancement : la carte s'éteint au prochain fetch.

## Statut par constructeur

| Constructeur | Source | « En cours » | SOC minimum | Arrêt |
|---|---|---|---|---|
| Renault / Dacia / Alpine | `RenaultHvacSource` | `hvacStatus === 'on'` (API HVAC) | `socThreshold` | oui |
| Hyundai | `HyundaiHvacSource` | `vehicleStatus.airCtrlOn === true` | non fourni (`null`) | non |
| Démo | `CommandOnlyHvacSource` | jamais | `null` | non |

Quand le SOC minimum est inconnu, l'avertissement « SOC minimum inconnu » est toujours affiché (comportement d'origine).

### Cas Hyundai

Hyundai ne fournit pas de statut de climatisation séparé. `airCtrlOn` fait partie de la réponse `/car/status`,
que le car loader Hyundai récupère déjà pour la batterie. Pour éviter un deuxième appel réseau :

- `HyundaiCarLoader` enregistre cette réponse via `CarStatusCache.saveHyundaiStatus` ;
- `HyundaiHvacSource` la relit via `CarStatusCache.getHyundaiStatus`, importé depuis l'API publique `kelec-car-page/index.ts` ;
- `syncStatus()` ne fait que relire le cache : il est appelé après le fetch batterie, donc le cache vient d'être mis à jour.

### Arrêt Renault : « stop » ou « cancel »

L'arrêt passe par le même endpoint que le lancement (`actions/hvac-start`), avec une autre `action` dans le body.
Selon le modèle, l'API attend `stop` ou `cancel`. La table par modèle de
[renault-api](https://github.com/hacf-fr/renault-api) (`kamereon/models.py`, `set_ac_stop`) indique :

| Action | Modèles |
|---|---|
| `stop` | Mégane E-Tech, R5, Alpine A290, Spring |
| `cancel` | R4, Master E-Tech, Zoé phase 1 ; valeur par défaut pour un modèle non documenté (Scénic E-Tech, Zoé phase 2…) |

renault-api précise ne pas avoir pu le vérifier sur tous les véhicules. `hvacStopActions` donne donc deux actions :
celle attendue pour le modèle choisi dans `CarType` (`kelec-garage`), puis l'autre. `RenaultHvacSource.stop()` envoie
la seconde seulement si l'API refuse la première (réponse sans `HvacStart` / `id`).
La Spring n'est pas dans `CarAvailableModels` : elle passe par la valeur par défaut (« cancel », puis « stop »).

**Scénic E-Tech : `stop`, vérifié sur une voiture** (model code `XCB1SE`, novembre 2026). L'API accepte aussi `cancel`
(réponse `HvacStart` avec un `id`), mais la climatisation continue de tourner. Le repli ne couvre donc pas ce cas :
une action acceptée sans effet n'est pas détectée. La Scénic est dans la liste `stop` de `hvacStopActions`.
Les autres modèles n'ont pas été vérifiés : ils suivent la table de renault-api.

## Stockage

| Clé | Contenu | Propriétaire |
|---|---|---|
| `<vin>/hvacStatus` | Réponse brute de l'API HVAC Renault | `RenaultHvacSource` |
| `<vin>/savedTemperature` | Dernière température choisie | `TemperaturePreferences` |
| `<vin>/batteryStatus` | Réponse de statut Hyundai (lue seulement) | `kelec-car-page` (`CarStatusCache`) |

- `savedTemperature` remplace l'ancienne clé `<vin>_savedTemperature` pour suivre le format `<vin>/<clé>`.
  Les anciennes valeurs ne sont pas reprises (décision assumée) : l'app revient à 21 °C.
- Une température stockée en dehors de la plage 17–27 est ignorée, et l'app revient à 21 °C.

## Historique du refactor

- `screen/loggedIn/CarsTab/CarView/Elements/HVACCard.tsx` (306 lignes) a été découpé entre modèles, contrôleurs et 4 vues.
- `lib/model/TemperatureHandler` a été remplacé par `services/temperaturePreferences`.
- `setHVACStatus`, `getIsHVACRunning`, `getMinimumHvacSOC` et `shouldDisplayHVACCard` ont été retirés de l'`ApiHandler` et de ses implémentations Renault et Hyundai.
- Le slot `hvacStatus` a été retiré de `RenaultCarLoader` : le fetch passe par `HvacProvider.sync()`, toujours seulement après une batterie OK.
- Nouveau : statut « en cours » sur Hyundai via `airCtrlOn`. Avant, il valait toujours `false` (`// to implement`).

## Tests

- `__tests__/packages/kelec-hvac/hvacServices.test.ts` : températures, `HvacStatus`, préférences (nouvelle clé, valeur hors plage), sources Renault (cache, erreur, arrêt : action du modèle, repli sur l'autre, double refus) et Hyundai (`airCtrlOn`, pas d'arrêt), `hvacStopActions`.
- Tests d'intégration : `__tests__/CarView/HVACCard/HVACCard.renault.test.tsx` (dont bouton d'arrêt absent quand la climatisation est éteinte, arrêt quand elle tourne), `HVACCard.hyundai.test.tsx` (dont affichage « en cours » avec `airCtrlOn` à `true` / `false`), `DemoAccount.test.tsx`.

## Traductions à ajouter

Clés nouvelles, absentes de `localizations.json` (en attendant, `getTranslation` affiche la clé) :

| Clé | Utilisation | Texte proposé (fr) |
|---|---|---|
| `stopPreHeat` | bouton d'arrêt de la feuille | Arrêter le confort thermique |
| `preHeatStopped` | alerte après un arrêt réussi | Le confort thermique a été arrêté |

