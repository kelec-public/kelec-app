# Package `kelec-charge-history`

Historique des charges d'une voiture : carte résumé sur la page voiture, écran d'historique par mois,
filtres, tri, fusion des charges, coût des charges et export Excel. L'import d'un export est dans un package à part,
[`kelec-charge-import`](./charge-import.md), qui passe par l'`index.ts` de ce package.

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-charge-history/
├── models/
│   ├── Charge.ts              Une charge (ou une session V2G), construction depuis le JSON / l'API V2G
│   ├── ChargesHistory.ts      Toutes les charges d'une voiture + totaux (énergie, durée)
│   ├── ChargeMonth.ts         Charges regroupées par mois (+ jours du mini-graphique)
│   ├── ChargeCosts.ts         Coût d'une charge et format du montant (devise des tarifs)
│   ├── ChargeCostOverrides.ts Prix saisis à la main, retrouvés par le début de la charge (à 5 s près)
│   └── Filter.ts              Types de filtres et liste des filtres disponibles
├── services/
│   ├── chargesFilters.ts      Application, édition et libellés des filtres (pur)
│   ├── chargeMonths.ts        Tri, fusion, regroupement par mois, jours du graphique (pur)
│   ├── mileageAtStart.ts      Kilométrage au début d'une charge (pur)
│   ├── chargesRepository.ts   Persistance locale (BatchedList de kelec-storage)
│   ├── knownChargeStarts.ts   Débuts de charge déjà vus, pour les doublons (à 5 s près)
│   ├── chargesExport.ts       Génération xlsx + feuille de partage
│   ├── chargeCost.ts          Coût d'une charge : prix saisi, sinon tarif (V2G : aucun ; fusionnée : somme des sous-charges) (pur)
│   ├── chargeCostOverridesRepository.ts   Prix saisis à la main (<vin>/chargeCostOverrides)
│   ├── createChargesSource.ts Choix de la source selon le constructeur
│   └── sources/
│       ├── renaultChargesSource.ts   Renault / Dacia / Alpine : API historique + sessions V2G
│       └── demoChargesSource.ts      Données de démo
├── controllers/
│   ├── ChargesHistoryProvider.tsx      Historique partagé d'une voiture : useChargesHistory() → { history, sync, importCharges }
│   ├── useChargesHistoryController.ts  État de l'écran : filtres, tri, pagination, modales, export
│   ├── ChargesFiltersContext.ts        Filtres actifs, pour les vues de filtres
│   ├── ChargeCostsContext.ts, useChargeCosts.ts   Coût des charges pour les vues (null sans tarif ni prix saisi)
│   ├── useChargeCostEditor.ts          Page du prix d'une charge : montant saisi, retour au tarif
│   └── useNumericalFilterController.ts Champs min / max d'un filtre numérique
├── views/
│   ├── ChargesSummaryCard.tsx   Carte de la page voiture (totaux)
│   ├── ChargesHistoryView.tsx   Écran d'historique
│   ├── ChargesOptionsSheet.tsx  Feuille « … » : tri, tarifs, import (si proposé) et export
│   ├── SetTariffBanner.tsx      Invitation à définir un tarif (tant qu'il n'y en a pas)
│   ├── ChargeCostEditView.tsx   Page du prix d'une charge (CHARGE_COST_ROUTE, param chargeStartDate)
│   ├── ActiveFiltersRow.tsx     Bouton Filtres + pastilles des filtres actifs
│   ├── ChargeMonthSection.tsx   Un mois (dépliable)
│   ├── ChargeMonthHeader.tsx    En-tête du mois : totaux + mini-graphique par jour
│   ├── ChargeCard.tsx           Une charge (+ détail des sous-charges si fusionnée)
│   └── filters/                 Modale des filtres (date, numériques, DC uniquement)
├── types/chargesSource.ts       Interface ChargesSource
├── routes.ts                    CHARGES_HISTORY_ROUTE, CHARGE_COST_ROUTE
└── index.ts                     API publique : Charge, useChargesHistory, KnownChargeStarts (utilisés par kelec-charge-import)
```

## Flux de données

1. `ChargesHistoryProvider` est monté par voiture dans `CarsPageView`.
2. Au montage : `source.loadCached()` lit `ChargesRepository` et met à jour l'historique.
3. Après un fetch batterie réussi (`useCarData` → `onNetworkLoaded`), `CarView` appelle `sync()` :
   - `RenaultChargesSource` récupère l'historique (`account.fetchChargesHistory`), le fusionne avec le stockage, puis fait de même avec les sessions V2G si le `CarType` les supporte ;
   - l'historique complet est renvoyé et diffusé.
4. `ChargesSummaryCard` et `ChargesHistoryView` lisent `useChargesHistory()`. L'écran d'historique se met donc à jour si la synchro se termine pendant qu'il est ouvert.
5. La carte résumé n'est affichée que si l'historique est disponible (`history.shouldDisplayChargesCard()`).
   Hyundai n'a pas de source (`createChargesSource` renvoie `null`) : l'historique reste indisponible et la carte n'apparaît pas.

## Stockage

| Clé | Contenu |
|---|---|
| `<vin>/chargesHistoryAmount` | Nombre de charges |
| `<vin>/chargesHistoryIndex<i>` | Lots de 50 charges (JSON) |
| `<vin>/chargesHistorySaved` | Ancien format (toutes les charges dans une seule entrée) : relu si présent, supprimé à la première écriture |
| `<vin>/chargeCostOverrides` | Prix saisis à la main : `[{ chargeStartDate, amount }]` |

- Les noms des champs sérialisés de `Charge` (`chargeStartDate`, `V2GEnergyDischarged`…) **ne doivent pas changer** : ils servent au stockage et à l'export.
- Lors d'un enregistrement, l'app dédoublonne sur l'**instant** de début, **à 5 secondes près** (`KnownChargeStarts`) : une date peut avoir ou non des millisecondes, et l'API Renault a déjà renvoyé une même charge avec une seconde d'écart d'un jour à l'autre. Elle trie ensuite par date croissante et calcule le kilométrage de départ quand l'historique kilométrique natif le permet.
  - `saveNewCharges` (API) : en cas de doublon, la nouvelle charge l'emporte.
  - `addMissingCharges` (import) : en cas de doublon, la charge déjà stockée l'emporte.
- Import : une source qui stocke les charges implémente `importCharges` (Renault). Le provider expose alors `importCharges`, sinon `null` (démo) et le bouton d'import n'est pas affiché.
  `ChargesHistoryView` reçoit `onImport` de `CarsPageView`, qui seul connaît la route d'import : `kelec-charge-history` ne dépend pas de `kelec-charge-import`.

## Coût des charges

Les tarifs sont ceux de [`kelec-charge-cost`](./charge-cost.md) (globaux), lus via son `index.ts` et relus quand l'écran reprend le focus
(au retour des pages des tarifs).

- `ChargeCard` : coût de la charge (`chargeCostText`). En-tête du mois : total des charges affichées (`chargeIndexCost`).
- Rien n'est affiché sans tarif ; une bannière (`setTariffBanner`) ouvre alors les tarifs. La feuille « … » a aussi un bouton « Tarif d'électricité ».
- `ChargesHistoryView` reçoit `onOpenTariffs` de `CarsPageView`, qui enregistre les pages des tarifs (`TARIFF_LIST_ROUTE`, `TARIFF_EDITOR_ROUTE`).
- Session V2G : pas de coût. Charge fusionnée : somme du coût des sous-charges, chacune à ses horaires (HP / HC).
- Le coût est calculé à l'affichage, jamais stocké : changer un tarif met à jour tout l'historique.

### Prix saisis à la main

Pour une charge payée ailleurs qu'à la maison : toucher la carte d'une charge (n'importe où, hors de ses boutons) ouvre la page « Prix de la charge » (`CHARGE_COST_ROUTE`).
- On y saisit le **montant payé** (dans la devise des tarifs), avec son équivalent au kWh et, pour comparer, le coût au tarif.
  « Revenir au tarif par défaut » retire le prix saisi.
- **Le prix saisi l'emporte** sur le tarif (y compris pour une session V2G). Il est signalé par une icône ✎ à côté du coût.
- **Charge fusionnée** : pas de prix à elle (elle commence comme sa première sous-charge, on ne cherche donc pas de prix pour elle) ;
  on modifie le prix d'une sous-charge depuis le détail de la fusion, qui se ferme avant l'ouverture de la page.
  Son coût est la somme des sous-charges, chacune avec son prix saisi ou au tarif ; ✎ si l'une d'elles a un prix saisi.
- **Stockage** : `<vin>/chargeCostOverrides`, liste de `{ chargeStartDate, amount }`, **à part des charges** : une synchro remplace la charge
  stockée par celle de l'API (`saveNewCharges`) et effacerait un champ ajouté à `Charge`. La charge est retrouvée par son début à 5 s près,
  comme les doublons. L'état est porté par `ChargesHistoryProvider` (partagé par l'historique et la page du prix).
- Sans aucun tarif, le coût n'est pas affiché, donc pas modifiable ; les prix déjà saisis restent affichés.
- Supprimer une voiture garde ses données locales, prix saisis compris (comme l'historique).

## Règles métier

- **Seuil DC** : une charge est DC si sa puissance moyenne est **≥ 26 kW** (`Charge.DC_THRESHOLD_KW`, `charge.isDCCharge()`).
  Ce seuil est utilisé par le filtre « DC uniquement », le mini-graphique du mois et le surlignage des cartes.
- **Fusion** (préférence `mergeCharges`) : deux charges qui se suivent sont fusionnées quand le niveau de début de la seconde est à ±1 % du niveau de fin de la première, qu'elle commence moins de 12 h après la fin de la première, et qu'elles sont du même type (V2G ou non). Les charges d'origine sont gardées en `subCharges`.
  La fusion ne sert qu'à l'affichage et à l'export : le stockage garde les charges d'origine. Elle se fait toujours sur une liste triée par date croissante (`selectCharges`).
- **Filtre date** : les dates choisies couvrent des **journées entières** (début à 00:00:00, fin à 23:59:59.999), quelle que soit l'heure de la sélection.
- **Filtres numériques** : un champ vide n'impose pas de borne (0 pour le min, 9999 pour le max). Vider les deux champs retire le filtre.
- **Pagination** : 2 mois affichés au départ, un de plus à chaque fin de liste. On revient à 2 quand on change le tri.
  Le nombre de mois disponibles (`countMonths`) est calculé après la fusion : un mois dont toutes les charges sont fusionnées
  dans une charge du mois précédent n'est pas compté (sinon « charger plus » ajouterait un mois vide).
- **Export** : les charges affichées (filtrées, fusionnées si l'option est active), dans l'ordre du tri, avec les dates en heure locale.
  Une ligne fusionnée a `isAMergeCharge = true` et le nombre de sous-charges dans `subChargesCount` (dernières colonnes).
  Avec des tarifs, `cost` (arrondi au centime, vide pour une session V2G), `currency` et `isManualCost` sont ajoutés juste avant ces deux colonnes.

## Historique du refactor

1. **Vues + MVC** : le code de `screen/loggedIn/CarsTab/CarView/ChargesView.tsx/` a été déplacé dans le package.
   `RenaultCharge` a été renommé `Charge`, et `RenaultChargesHandler` a été découpé entre `ChargesHistory` et les services.
   `ChargesStorageController` est devenu `ChargesRepository`, et `lib/model/filters` est devenu `models/Filter` + `services/chargesFilters`.
2. **Données** : le fetch est sorti de `RenaultCarLoader`. `setChargesHistory`, `getChargesHistory` et `shouldDisplayChargesCard` ont été retirés de l'`ApiHandler`.
   Le provider remplace le passage de l'historique par les paramètres de route, qui n'était pas sérialisable et donnait une copie figée.
3. **Stockage** : la logique de lots est passée dans `BatchedList` (`kelec-storage`), avec les mêmes clés.
4. **Corrections apportées au passage** :
   - seuil DC unifié à 26 kW (avant : > 25 sur la carte, > 26 sur le graphique, ≥ 26 dans le filtre) ;
   - le filtre date ignorait les charges faites avant l'heure courante le jour de début (et après, le jour de fin) ;
   - vider un seul champ d'un filtre numérique laissait l'ancienne borne appliquée ;
   - calcul des jours futurs du mini-graphique (débordement de `setDate` / `setMonth`) ;
   - le tri modifiait le tableau d'origine des charges ;
   - la prop `carType`, jamais utilisée, a été supprimée des vues.

## Tests

- `__tests__/packages/kelec-charge-history/chargeServices.test.ts` :
  - filtres (dont les journées entières du filtre date), regroupement par mois, jours du graphique ;
  - fusion : critères (±1 % de niveau, moins de 12 h d'écart, même type V2G), fusion d'une liste non triée (`selectCharges`),
    mois non comptés après fusion (`countMonths`) ;
  - lignes d'export (`toRows`) : `isAMergeCharge` et `subChargesCount` en dernières colonnes, sans le détail `subCharges`.
- `__tests__/lib/chargesStorageController.test.tsx` : stockage via `ChargesRepository`, dédoublonnage sur l'instant de début,
  charges importées (`addMissingCharges`) conservées après une nouvelle synchro avec l'API.
- `__tests__/packages/kelec-storage/BatchedList.test.ts` : stockage par lots et migration de l'ancien format.
- Tests d'intégration : `__tests__/CarView/ChargesCard.renault.test.tsx` (dont « pas de fetch des charges si la batterie est en erreur »), `ChargesView.renault.test.tsx`, `FilterView/`, `Charges/MergeCharges.test.tsx`, `Elements/ChargeCard/`.
  Le parcours d'import (bouton « Importer » de la feuille d'options) est couvert par `Charges/ImportCharges.test.tsx`, décrit dans [charge-import.md](./charge-import.md).
