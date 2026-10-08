# Kelec — notes pour les agents

App React Native (TypeScript). Les fonctionnalités sont en cours de migration vers `src/packages/kelec-*` :
lire [docs/packages-pattern.md](docs/packages-pattern.md) avant de toucher à `src/packages`.
La migration avance par petites PR : ne pas élargir une tâche à d'autres packages sans le demander.

Natif iOS (widgets, bridge RN, Apple Watch, package local `renaultApi`) : lire [docs/native-ios.md](docs/native-ios.md)
avant de toucher à `ios/`. Les clés de stockage partagé et leurs formats y sont listés : ne jamais les renommer.
Natif Android (widgets, bridge RN, modules `:carapi` / `:shared`, app Wear OS `:wear`) : lire
[docs/native-android.md](docs/native-android.md) avant de toucher à `android/`. Ne jamais renommer `KelecMainWIdget` ni les clés de stockage.

**Invariant métier** : un VIN est unique dans toute l'app, et chaque VIN a exactement un compte (`Account`).
Le VIN suffit donc à identifier une voiture et son compte.

## Vérifier son travail

- Tests : `npx jest`. Toute la suite doit passer.
- Types : `npx tsc --noEmit`. Aucune erreur ne doit apparaître. Le `tsconfig.json` hérite de `@react-native/typescript-config` :
  les types de React Native ne sont lus qu'avec sa résolution de modules (`exports` du package).
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
  ni un champ sérialisé (ex. `Charge`) sans décision explicite. En particulier, la clé du mot de passe dans le
  stockage chiffré reste `<vin>_password` (lue par les widgets iOS/Android et l'intent Siri).
- **Mots de passe** : ils ne vont que dans le stockage chiffré (`PasswordVault`, kelec-garage). Le JSON du compte
  (AsyncStorage et widgets) est toujours enregistré sans mot de passe, via `AccountRepository.save`.
- **Stockage chiffré dans les tests** : `jest.setup.js` le simule dans AsyncStorage (`get/setNativeCryptedData`).
- **Traductions** : ne pas modifier `src/lib/model/localization/localizations.json`. Utiliser
  `languageHandler.getTranslation("clé")` et signaler les nouvelles clés : les textes sont ajoutés à la main.
