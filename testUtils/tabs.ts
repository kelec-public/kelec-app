import { act, screen } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

/**
 * Onglets natifs (react-native-screens) dans les tests : la barre est dessinée par iOS / Android,
 * il n'y a donc pas de bouton à presser. On fait comme le natif : l'hôte des onglets reçoit
 * `onTabSelected` avec la clé de l'écran choisi.
 * `UNSAFE_root` : `screen.root` ne renvoie que le premier élément hôte (parfois une modale),
 * pas tout l'arbre.
 */

const localizations = require('../src/lib/model/localization/localizations.json');

/** Les onglets portent leur titre traduit (les tests tournent en français). */
const getTabTitle = (translationKey: string): string => localizations.fr[translationKey] ?? translationKey;

const findTabScreen = (translationKey: string): ReactTestInstance | undefined => {
    const title = getTabTitle(translationKey);
    return screen.UNSAFE_root.findAll(
        node => typeof node.type === 'string' && node.props.screenKey !== undefined && node.props.title === title,
    )[0];
};

/** Vrai si la barre d'onglets est affichée avec cet onglet (ex. 'account'). */
export const hasTab = (translationKey: string): boolean => findTabScreen(translationKey) !== undefined;

let provenance = 0;

/** Sélectionne un onglet comme un appui de l'utilisateur sur la barre native. */
export const selectTab = async (translationKey: string): Promise<void> => {
    const tabScreen = findTabScreen(translationKey);
    if (tabScreen === undefined) throw new Error(`Onglet introuvable : ${translationKey}`);

    const host = screen.UNSAFE_root.findAll(
        node => typeof node.type === 'string' && node.props.navStateRequest !== undefined,
    )[0];

    provenance += 1;
    await act(async () => {
        host.props.onTabSelected({
            nativeEvent: { selectedScreenKey: tabScreen.props.screenKey, provenance, actionOrigin: 'user' },
        });
    });
};
