import { Platform } from "react-native";
import { Edge } from "react-native-safe-area-context";

/**
 * Bords à protéger pour un écran ouvert avec `presentation: 'modal'` depuis un onglet.
 * - iOS : la modale recouvre la barre d'onglets, il faut donc la marge du bas (barre d'accueil).
 * - Android : native-stack ne gère pas les modales, l'écran s'ouvre comme une page classique
 *   au-dessus de la barre d'onglets, qui gère déjà le bas de l'écran : on retire la marge du bas.
 * Les marges elles-mêmes restent celles de l'appareil (react-native-safe-area-context).
 */
export const modalSafeAreaEdges = (edges: Edge[]): Edge[] =>
    Platform.OS === 'ios' ? edges : edges.filter(edge => edge !== 'bottom');
