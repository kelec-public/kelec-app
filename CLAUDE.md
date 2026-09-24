# Kelec — notes pour les agents

App React Native (TypeScript). Les fonctionnalités sont en cours de migration vers `src/packages/kelec-*` :
lire [docs/packages-pattern.md](docs/packages-pattern.md) avant de toucher à `src/packages`.
La migration avance par petites PR : ne pas élargir une tâche à d'autres packages sans le demander.

## Vérifier son travail

- Tests : `npx jest`. Toute la suite doit passer.
- Types : `npx tsc --noEmit -p tsconfig.json --ignoreDeprecations 6.0 --baseUrl .`
  (`tsc -p .` seul échoue sur la config). 3 erreurs sont déjà présentes et connues
  (`useCarProfile.ts`, `ProfileView.tsx`, `DebugZoneView.tsx`) : il ne faut pas en ajouter.
- Lint : `npm run lint`. Il n'est pas lancé en CI, et le repo a déjà des erreurs ESLint.
  Au minimum, les règles de frontières entre packages (`no-restricted-imports`) doivent passer sur `src/packages`.

## Pièges

- **Jest et npx modifient des fichiers suivis par git** : `package-lock.json` (retour à la ligne final),
  `test-report.html` et `reports/`. Les restaurer (`git checkout -- <fichier>`) avant de commiter.
- **Les tests lisent la structure JSX** (`getByTestId(...).props.children[1]`) : garder les `testID`
  et le découpage des `<Text>` quand on déplace une vue, même si le rendu à l'écran ne change pas.
- **Les tests d'intégration mockent `renaultClient` / `hyundaiClient` fichier par fichier.**
  Un nouvel appel client doit être ajouté dans les mocks concernés.
- **`Alert.alert` n'est pas réinitialisé entre les tests** d'un même fichier : les compteurs
  (`toHaveBeenCalledTimes`) s'additionnent.
- **Des données sont déjà stockées sur les téléphones des utilisateurs** : ne pas renommer une clé AsyncStorage
  ni un champ sérialisé (ex. `Charge`) sans décision explicite.
- **Traductions** : ne pas modifier `src/lib/model/localization/localizations.json`. Utiliser
  `languageHandler.getTranslation("clé")` et signaler les nouvelles clés : les textes sont ajoutés à la main.
