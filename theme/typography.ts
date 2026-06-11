import { Platform, TextStyle } from 'react-native';

// Sur Android, fontFamily = nom du fichier (sans extension)
// Sur iOS, fontFamily = PostScript name (nameID 6 de la police)
export const Fonts = {
  light: Platform.select({ ios: 'NouvelR-Light', android: 'NouvelRLight' }),
  semiLight: Platform.select({ ios: 'NouvelR-Book', android: 'NouvelRBook' }),
  regular: Platform.select({ ios: 'NouvelR-Regular', android: 'NouvelRRegular' }),
  semibold: Platform.select({ ios: 'NouvelR-Semibold', android: 'NouvelRSemibold' }),
  bold: Platform.select({ ios: 'NouvelR-Bold', android: 'NouvelRBold' }),
  black: Platform.select({ ios: 'NouvelR-Extrabold', android: 'NouvelRExtrabold' }),
};

export const typography: Record<string, TextStyle> = {
  button: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  }
};