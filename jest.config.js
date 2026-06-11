const { defaults: tsjPreset } = require("ts-jest/presets");

process.env.TZ = 'Europe/Paris';
module.exports = {
  ...tsjPreset,
  preset: '@react-native/jest-preset',
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    'react-native-maps': '<rootDir>/__mocks__/react-native-maps.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|react-native-config|color|color-string|color-convert|color-name|@zoontek)',
  ],
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: 'reports',
        outputName: 'test-report.xml',
        relativeRootDir: './',
        reportedFilePath: 'relative',
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'Rapport de Test',
        outputPath: './test-report.html',
        includeFailureMsg: true,
      },
    ],
  ],
};

