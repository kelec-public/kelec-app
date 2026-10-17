import { Appearance } from "react-native";
import ColorTheme from "../../../lib/appPreferences/interface/colorTheme";

export const COLOR_THEMES: ColorTheme[] = ['auto', 'light', 'dark'];

/**
 * Applique le thème à toute l'app : `useColorScheme()` renvoie ensuite le thème forcé,
 * et le natif suit (iOS : `overrideUserInterfaceStyle` des fenêtres, Android : `AppCompatDelegate`).
 */
export function applyColorTheme(theme: ColorTheme): void {
    Appearance.setColorScheme(theme);
}
