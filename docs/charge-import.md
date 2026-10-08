# Package `kelec-charge-import`

Import d'un fichier xlsx exporté depuis l'historique de charge : choix du fichier, lecture, aperçu
(totaux avant / après, charges déjà présentes, lignes illisibles), puis ajout à l'historique.

Pattern général : voir [packages-pattern.md](./packages-pattern.md). Ce package ne lit et n'écrit l'historique
que via l'`index.ts` de [`kelec-charge-history`](./charge-history.md) (`Charge`, `useChargesHistory().importCharges`).

## Structure

```
kelec-charge-import/
├── models/
│   ├── SpreadsheetRow.ts     Une ligne du fichier : cellules par en-tête + numéro de ligne
│   └── ImportPreview.ts      Résultat de la lecture (nouvelles charges, doublons, lignes rejetées) + totaux avant / après
├── services/
│   ├── pickSpreadsheet.ts    Sélecteur de fichiers (@react-native-documents/picker) + lecture en base64
│   ├── readSpreadsheet.ts    xlsx → lignes (pur)
│   ├── dateFormat.ts         Lecture des dates : ISO, format local du téléphone, cellule date (pur)
│   ├── rowParser.ts          Ligne → Charge, ou null si illisible (pur)
│   └── importPreview.ts      Comparaison avec l'historique, totaux (pur)
├── controllers/
│   └── useChargesImportController.ts   État de l'écran : lecture, aperçu, enregistrement, alertes
├── views/
│   ├── ChargesImportView.tsx      Écran (StepLayout, bouton « Importer » en bas)
│   ├── ImportFilePickerCard.tsx   Zone de choix du fichier
│   └── ImportPreviewSection.tsx   Totaux avant → après
├── routes.ts                 CHARGES_IMPORT_ROUTE
└── index.ts                  ChargesImportView, CHARGES_IMPORT_ROUTE
```

`CarsPageView` enregistre la route et passe à `ChargesHistoryView` un `onImport` qui y navigue.

## Formats d'export à gérer

L'export écrit les champs de `Charge` avec `json_to_sheet` : les en-têtes sont les noms des champs, et l'ordre des
colonnes suit celui des propriétés au moment de l'export. **Les colonnes sont donc lues par leur en-tête, jamais par position.**

| Période (repo d'origine `kelec-app/Kelec`) | Dates | Colonnes |
|---|---|---|
| mai 2024 → 8 déc. 2024 | ISO de l'API (`2024-08-23T07:57:41Z`) | `chargeStartDate`, `chargeEndDate`, `chargeDuration`, `chargeStartBatteryLevel`, `chargeEndBatteryLevel`, `chargeEnergyRecovered`, `chargeEndStatus` |
| 8 déc. 2024 (#52) → | `toLocaleString()` du téléphone | idem |
| juin 2025 (#183, fusion) | locale | + `isAMergeCharge`, `subCharges` (tableau : cellule inutilisable) |
| juillet 2025 (#197) | locale | + `mileageAtStart`, `inaccurateMileage` |
| oct. 2025 (#216, V2G) | locale | + `V2GEnergyDischarged`, `isV2G` |
| oct. 2026 (#81) | locale | sans `subCharges` ; `isAMergeCharge` et `subChargesCount` en dernier |

## Règles

- **Colonnes obligatoires** : dates de début et de fin, durée, niveaux de début et de fin. Une ligne où l'une manque ou est illisible
  est ignorée et comptée dans l'aperçu (avec son numéro de ligne). Un niveau à 0 est valide.
- **Dates locales** : l'ordre jour / mois est déterminé une fois pour tout le fichier. Un nombre > 12 en première position prouve
  un ordre jour-mois, en deuxième position un ordre mois-jour. Sans preuve, on prend l'ordre de la locale de l'appareil
  (le fichier a très probablement été exporté depuis ce téléphone). Une date qui commence par une année à 4 chiffres est lue
  année-mois-jour. Les indicateurs AM / PM (en, el, ko, zh, ja) sont gérés. L'heure est interprétée dans le fuseau de l'appareil.
- **Dates enregistrées** au format de l'API (`…T07:57:41Z`, sans millisecondes), comme les charges venant de l'API.
- **Doublons** : une charge dont le début est déjà dans l'historique (ou plus haut dans le fichier), à 5 secondes près
  (`KnownChargeStarts`, kelec-charge-history), n'est pas importée. Les anciens exports ISO ont la même charge avec une seconde d'écart ;
  la charge déjà stockée l'emporte (`ChargesRepository.addMissingCharges`).
- **Lignes fusionnées** : importées comme une charge simple (`isAMergeCharge = false`), le détail des sous-charges n'étant pas dans le fichier.
- **Fichier illisible** : xlsx lit n'importe quel fichier comme une feuille vide ; un fichier sans aucune ligne est donc traité comme une erreur.
- **Kilométrage** : repris du fichier s'il y est, sinon calculé à l'enregistrement comme pour les charges de l'API.

## Tests

- `__tests__/packages/kelec-charge-import/dateFormat.test.ts` : formats de date des différentes locales, détection de l'ordre, valeurs refusées.
- `__tests__/packages/kelec-charge-import/chargesImport.test.ts` : chaque version de l'export (fichiers xlsx générés), doublons, lignes rejetées, totaux.
- `__tests__/CarView/Charges/ImportCharges.test.tsx` : parcours complet dans l'app (sélecteur et lecture de fichier mockés dans `jest.setup.js`).
