# Package `kelec-charge-cost`

Tarifs de l'électricité à la maison, propres à chaque voiture, et coût d'une charge. Les tarifs se règlent dans l'onglet Réglages (section « Électricité »)
ou depuis l'historique de charge, qui affiche le coût des charges (voir [charge-history.md](./charge-history.md#coût-des-charges)).

Pattern général : voir [packages-pattern.md](./packages-pattern.md).

## Structure

```
kelec-charge-cost/
├── models/
│   ├── Tariff.ts              Tariff (prix fixe | heures pleines / creuses), TariffSettings (devise + tarifs), dates et heures locales
│   └── tariffDraft.ts         Tarif en cours de saisie (prix en texte) → Tariff, ou clé de l'erreur
├── services/
│   ├── chargeCost.ts          computeCost(début, fin, kWh, tarifs, pertes en %) (pur)
│   ├── tariffList.ts          Ajout / modification par id, suppression, fin et état (terminé, en cours, à venir) d'un tarif (pur)
│   ├── tariffRepository.ts    Lecture / écriture (tarifs par VIN, devise globale), migration de l'ancien tarif commun, abonnement aux enregistrements
│   ├── offPeakSummary.ts      Plages sur la journée (frise), heures pleines (le reste de la journée), total par jour / semaine, jours aux mêmes plages, noms des jours, économie en %
│   └── priceFormat.ts         Montants dans la devise, symbole de la devise, dates locales
├── controllers/
│   ├── useTariffSettings.ts   Tarifs d'une voiture lus au montage, puis mis à jour à chaque enregistrement (aussi utilisé par l'historique)
│   ├── useTariffList.ts       Tarifs relus à chaque affichage de la page, devise, pertes à la recharge (texte saisi, enregistré à chaque valeur valide)
│   ├── useTariffEditor.ts     Tarif saisi (existant ou nouveau), enregistrement, suppression, alertes
│   └── useVehicleName.ts      Nom de la voiture dont on affiche les tarifs (sous-titre des pages)
├── views/
│   ├── TariffListScreen.tsx      Page des tarifs d'une voiture (TARIFF_LIST_ROUTE, param vin)
│   ├── TariffEditorScreen.tsx    Page de saisie d'un tarif (TARIFF_EDITOR_ROUTE, params vin et tariffId)
│   ├── TariffPageLayout.tsx      En-tête PageHeader + contenu défilant + bouton fixé en bas (optionnel)
│   ├── TariffListView.tsx        Devise + une carte par tarif (TariffCard), le plus récent en haut
│   ├── TariffEditorView.tsx      Période, type, carte des prix, carte des plages d'heures creuses
│   ├── TariffCard.tsx            État, type, période, une ligne par prix
│   ├── PriceRow.tsx, OffPeakTimeline.tsx, PickerButton.tsx (date ou heure), Badge.tsx, IconBox.tsx
│   ├── DayPicker.tsx             Jours d'une plage d'heures creuses (une pastille par jour, du lundi au dimanche)
│   ├── ChoicePills.tsx           Choix sur une ligne qui défile (devise, type de tarif)
│   └── tariffLabels.ts           Libellé de la période
├── routes.ts                  TARIFF_LIST_ROUTE, TARIFF_EDITOR_ROUTE, TariffListRouteParams, TariffEditorRouteParams
└── index.ts                   les deux pages et leurs routes, computeCost, useTariffSettings, TariffRepository, formatPrice
```

`computeCost` reçoit des valeurs simples (dates, kWh) et pas une `Charge` : `kelec-charge-history` pourra importer ce package
sans que ce package dépende de l'historique.

## Ouverture

Deux **pages poussées** (pas de modale) : Réglages → Tarifs → Saisie d'un tarif. Le navigateur qui les ouvre (`SettingsNavigator`, et `CarsPageView` depuis l'historique)
enregistre `TARIFF_LIST_ROUTE` et `TARIFF_EDITOR_ROUTE` et fournit la navigation (`onBack`, `onOpenTariff`, `onDone`).
Les paramètres de route sont sérialisables (`vin`, et `tariffId` pour la saisie) : chaque page relit les tarifs de la voiture.

- **Depuis l'historique** : les tarifs de la voiture affichée (`CarsPageView` passe son VIN).
- **Depuis Réglages → Tarif d'électricité** : avec une seule voiture, ses tarifs s'ouvrent directement ; avec plusieurs, on choisit d'abord
  la voiture (`ChoiceModal`, titre `chooseTheCar`, une ligne par voiture, `tariffVehicleButton<vin>`). Sans voiture, la ligne est masquée.
- **La voiture est rappelée sous le titre** des deux pages (sous-titre de `PageHeader`, `tariffVehicleName`) : « modèle · plaque »,
  ou « modèle · VIN » sans plaque (`carLabel`, kelec-garage : le même libellé que dans la liste des Réglages).

- **En-tête `PageHeader`** (kelec-model, le même que l'historique de charge) : retour à gauche, action à droite
  (« + » sur la liste, ✓ sur la saisie). Pas de boutons en bas, donc **la barre d'onglets reste affichée**.
- Liste vide : un bouton « Ajouter un tarif » dans le contenu, plus explicite que le « + » pour le premier tarif.
- « Supprimer le tarif » est fixé en bas de la saisie, juste au-dessus de la barre d'onglets, loin de ✓ (`footer` de `TariffPageLayout`).
  Sur iOS, la barre flotte par-dessus l'écran : le bouton prend la marge du bas de l'onglet, qui comprend la barre ; sur Android, l'écran s'arrête déjà au-dessus.
- Un tarif se modifie sur sa page, puis on revient à la liste, mise à jour par l'enregistrement.
- **Page des tarifs** : devise (sans carte), « Pertes à la recharge » (champ en %, `chargingLossInput`, avec une explication ou l'erreur en dessous, `chargingLossHint`), puis « Historique d'application » (nombre de périodes) et une carte par tarif, la plus récente en haut
  (`tariffRow<index>` garde l'index chronologique). Chaque carte : état (« Actif en ce moment » en vert, « Archivé », « À venir »), type,
  période, puis les prix : heures pleines avec leurs plages (le reste de la journée), heures creuses avec leurs plages, leur durée et l'économie en %.
- **Page de saisie** : « Période d'application » (« Depuis le début », ou la date de début à droite, puis la fin si un tarif suit),
  type de tarif, carte « Prix par kWh » (badge « -28 % » quand les heures creuses coûtent moins cher),
  et pour les heures pleines / creuses une carte des plages : total par jour, frise de 00h à 24h, une ligne par plage (heures, puis ses jours), ajout en pointillés.
  Quand les plages changent selon le jour : total par semaine, et une frise par groupe de jours aux mêmes plages (« lun. – ven. », « sam., dim. »).
  Sur la carte de la liste, les plages sont alors données par groupe de jours (un jour sans heures creuses : « toute la journée » en heures pleines).
- **Grande police** : les titres de carte passent à la ligne ; les lignes de choix (devise, type de tarif) défilent horizontalement.
- Pas de `Modal` de React Native : avec une pile native à l'intérieur, la modale ne recevait plus aucun appui sur iOS.

## Règles

- **Tarifs par voiture** : chaque voiture a ses propres tarifs (ex. une voiture rechargée chez soi, une autre au travail).
  Une voiture ajoutée démarre sans tarif. Les voitures de la démo n'ont pas de tarif par défaut.
- **Une période par tarif** : un tarif commence à sa date (`validFrom`, 00:00 heure du téléphone) et s'arrête quand le suivant commence.
  Il n'y a pas de date de fin stockée (ni trou, ni chevauchement possible).
- **Le premier tarif est « depuis le début »** (`validFrom: null`) : il s'applique à toutes les charges plus anciennes. C'est le seul sans date,
  il ne peut pas en recevoir, et il ne se supprime que s'il est seul. Supprimer un autre tarif rend sa période au tarif précédent.
- **Deux tarifs ne commencent pas le même jour.**
- **Identifiant** : chaque tarif a un UUID (`react-native-uuid`). On le retrouve par cet id, pas par sa position ni par sa date,
  qui peuvent changer quand on insère ou modifie un tarif.
- **Une seule devise** pour toute l'app, toutes voitures comprises (un total ne mélange donc jamais deux devises ; la changer depuis une voiture la change pour toutes) : l'euro et les autres devises de l'UE,
  de l'EEE, du Royaume-Uni et de la Suisse (EUR, GBP, CHF, NOK, SEK, DKK, ISK, PLN, CZK, HUF, RON ; `CURRENCIES`).
- **Heures creuses** : une ou plusieurs plages « HH:MM → HH:MM », éventuellement à cheval sur minuit. Début et fin égaux : refusé.
  **Les plages ne peuvent pas se chevaucher** (refusé à l'enregistrement, ex. 22:00 → 06:00 puis 03:00 → 07:00) ; elles peuvent se toucher (06:00).
  Le calcul ne compte de toute façon qu'une fois un temps couvert par deux plages.
- **Jours des heures creuses** : chaque plage a ses jours (`days`, numérotés comme `Date.getDay()`, 0 = dimanche). Ce sont les jours où elle **commence** :
  22:00 → 06:00 du lundi au vendredi couvre aussi le samedi matin, mais pas le lundi matin. Pas de champ `days` : tous les jours
  (les tarifs enregistrés avant les jours n'en ont pas, et il n'est pas écrit pour « tous les jours »). Au moins un jour (le dernier ne se décoche pas).
  Le chevauchement est vérifié sur la semaine (22:00 → 06:00 le vendredi chevauche 03:00 → 07:00 le samedi).
  Une journée entière se saisit en deux plages (00:00 → 12:00 et 12:00 → 00:00), car début et fin égaux restent refusés.
- **Calcul** : l'énergie est répartie au prorata du temps (puissance supposée constante), entre tarifs et entre heures pleines / creuses.
  Les jours sont construits en heure locale : la nuit d'un changement d'heure dure bien 7 h ou 9 h. Charge sans durée : tout au prix du début.
- **Pertes à la recharge** (par voiture, `chargingLoss` de `TariffSettings`, en %) : l'énergie payée au réseau est celle reçue par la batterie, plus les pertes.
  Avec 10 %, le coût au tarif est multiplié par 1,10 (toutes les charges, quelle que soit la période du tarif). Saisie de 0 à 100 % (virgule ou point) ; vide = 0.
  Elle est enregistrée à chaque saisie valide (taper « 20 » enregistre 2, puis 20) ; une saisie invalide est signalée et garde la dernière valeur valide.
  Les prix saisis à la main dans l'historique sont des montants payés : les pertes ne s'y ajoutent pas.
- Les coûts ne sont jamais stockés : modifier un tarif met à jour tous les coûts.
- **Mise à jour des écrans ouverts** : `TariffRepository.save` prévient les abonnés (`subscribe`, avec le VIN), et `useTariffSettings(vin)` s'abonne
  (il reprend les tarifs de sa voiture, et la devise de n'importe quel enregistrement)
  (pas de relecture au focus : toutes les écritures passent par `save`). Le focus ne suffirait pas : chaque voiture a son propre `NavigationContainer`, donc l'historique resté ouvert dans l'onglet Voitures
  ne reprend pas le focus quand on revient des Réglages.

## Stockage

| Clé | Contenu | Propriétaire |
|---|---|---|
| `electricityTariffs` (AppStorage) | `{ currency, tariffs? }` : la devise de l'app. `tariffs` est l'ancien tarif commun à toutes les voitures, gardé tel quel mais plus écrit | `kelec-charge-cost` (`TariffRepository`) |
| `<vin>/electricityTariffs` (VinStorage) | `Tariff[]`, trié par date de début | `kelec-charge-cost` (`TariffRepository`) |
| `<vin>/chargingLoss` (VinStorage) | Pertes à la recharge en % (texte, ex. `'12.5'`). Absente : aucune perte (retirée quand on revient à 0) | `kelec-charge-cost` (`TariffRepository`) |
| `electricityTariffsPerVehicle` (AppStorage) | `'true'` une fois l'ancien tarif commun recopié sur les voitures | `kelec-charge-cost` (`TariffRepository`) |

**Migration** (une seule fois, au montage de `CarsPageView`, `TariffRepository.migrateToVehicles`) : l'ancien tarif commun est recopié
sur chaque voiture du garage qui n'a pas encore ses tarifs, sauf les voitures de la démo, puis le marqueur est posé. Les voitures ajoutées ensuite
démarrent sans tarif. Tant que le marqueur n'est pas posé, une voiture sans tarifs propres lit l'ancien tarif commun.
Les lectures et écritures attendent une migration en cours. En cas d'échec, rien n'est marqué : elle sera refaite au prochain lancement.

## Tests

- `__tests__/packages/kelec-charge-cost/chargeCost.test.ts` : prix fixe, pertes à la recharge, plage sur minuit, prorata HP / HC, plusieurs plages,
  plages qui se chevauchent, charge sur plusieurs jours, changement d'heure, changement de tarif (avant, après, à cheval), charge sans durée,
  heures creuses selon le jour (plage qui déborde sur le lendemain, week-end entier).
- `__tests__/packages/kelec-charge-cost/tariffs.test.ts` : saisie (prix, plages), ajout / modification par id, dates en double,
  tarif « depuis le début », suppression, fin d'un tarif, stockage par voiture et devise commune, pertes (saisie, stockage par voiture), migration de l'ancien tarif commun, format des prix, total d'heures creuses, heures pleines, économie, état d'un tarif,
  plages selon le jour (chevauchement sur la semaine, ordre des jours, jours regroupés, total par semaine, jours en texte).
- `__tests__/SettingsView/SettingsView.test.tsx` (« should set the electricity tariff ») : une voiture (ouverture directe), devise, premier tarif, passage en HP / HC, prix manquant refusé ;
  (« with several cars… ») choix de la voiture, tarif enregistré pour elle seule ;
  (« off-peak hours can depend on the day of the week ») jours d'une plage, frise par groupe de jours, dernier jour gardé.
