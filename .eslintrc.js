// Frontières entre packages (src/packages) :
// - les packages d'infrastructure ne dépendent d'aucune feature ;
// - une feature n'importe une autre feature que via son point d'entrée public (index.ts).
const INFRA_PACKAGES = ['kelec-model', 'kelec-storage'];
const FEATURE_PACKAGES = ['kelec-car-page', 'kelec-login', 'kelec-charge-history', 'kelec-hvac'];

const packageFiles = name => [`src/packages/${name}/**/*.ts`, `src/packages/${name}/**/*.tsx`];

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    ...INFRA_PACKAGES.map(name => ({
      files: packageFiles(name),
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: FEATURE_PACKAGES.flatMap(feature => [`**/${feature}`, `**/${feature}/**`]),
            message: `${name} est un package d'infrastructure : il ne doit dépendre d'aucune feature.`,
          }],
        }],
      },
    })),
    ...FEATURE_PACKAGES.map(name => ({
      files: packageFiles(name),
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: FEATURE_PACKAGES.filter(other => other !== name).map(other => `**/${other}/**`),
            message: "Importer une autre feature uniquement via son index (ex. '../../kelec-car-page').",
          }],
        }],
      },
    })),
  ],
};
