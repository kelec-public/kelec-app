// Frontières entre packages (src/packages), voir docs/packages-pattern.md :
// - infrastructure : ne dépend ni du domaine partagé ni des features ;
// - domaine partagé : ne dépend d'aucune feature ;
// - un package de domaine ou de feature n'est importé par un autre package que via son index.ts.
const INFRA_PACKAGES = ['kelec-model', 'kelec-storage'];
const DOMAIN_PACKAGES = ['kelec-garage', 'kelec-preferences'];
const FEATURE_PACKAGES = ['kelec-car-page', 'kelec-login', 'kelec-charge-history', 'kelec-hvac', 'kelec-profile', 'kelec-settings'];

const packageFiles = name => [`src/packages/${name}/**/*.ts`, `src/packages/${name}/**/*.tsx`];
const anyImportOf = names => names.flatMap(name => [`**/${name}`, `**/${name}/**`]);
const deepImportOf = names => names.map(name => `**/${name}/**`);
// (ESLint refuse un groupe vide, d'où le filtre)
const restrict = patterns => ({ 'no-restricted-imports': ['error', { patterns: patterns.filter(p => p.group.length > 0) }] });

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    ...INFRA_PACKAGES.map(name => ({
      files: packageFiles(name),
      rules: restrict([{
        group: anyImportOf([...DOMAIN_PACKAGES, ...FEATURE_PACKAGES]),
        message: `${name} est un package d'infrastructure : il ne doit dépendre ni du domaine ni des features.`,
      }]),
    })),
    ...DOMAIN_PACKAGES.map(name => ({
      files: packageFiles(name),
      rules: restrict([
        {
          group: anyImportOf(FEATURE_PACKAGES),
          message: `${name} est un package de domaine partagé : il ne doit dépendre d'aucune feature.`,
        },
        {
          group: deepImportOf(DOMAIN_PACKAGES.filter(other => other !== name)),
          message: "Importer un autre package de domaine uniquement via son index.",
        },
      ]),
    })),
    ...FEATURE_PACKAGES.map(name => ({
      files: packageFiles(name),
      rules: restrict([{
        group: deepImportOf([...DOMAIN_PACKAGES, ...FEATURE_PACKAGES.filter(other => other !== name)]),
        message: "Importer un package de domaine ou une autre feature uniquement via son index (ex. '../../kelec-garage').",
      }]),
    })),
  ],
};
