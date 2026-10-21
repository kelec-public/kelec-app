import { Platform, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../lib/graphics/utils";
import PageHeader, { PageHeaderAction } from "../../kelec-model/view/PageHeader";
import { spacerL, spacerM, spacerXXL } from "../../kelec-model/view/Spacers";

type Props = {
    readonly testID: string;
    /** Titre déjà traduit. */
    readonly title: string;
    readonly onBack: () => void;
    readonly backTestID: string;
    readonly action: PageHeaderAction;
    readonly children: React.ReactNode;
    /** Bouton fixé en bas, juste au-dessus de la barre d'onglets (le contenu défile au-dessus). */
    readonly footer?: React.ReactNode;
};

/**
 * Marge du bas du bouton fixé : sur iOS, la barre d'onglets flotte par-dessus l'écran et sa hauteur est dans la marge du bas
 * (fournisseur de l'onglet) ; sur Android, l'écran s'arrête déjà au-dessus de la barre.
 */
const FOOTER_EDGES: Edge[] = Platform.OS === 'ios' ? ['bottom'] : [];

/**
 * Page des tarifs : en-tête (comme l'historique de charge), contenu défilant, et éventuellement un bouton fixé en bas.
 * La barre d'onglets reste affichée : iOS décale le bas du contenu (`contentInsetAdjustmentBehavior`),
 * et sur Android la barre réserve déjà sa hauteur.
 */
function TariffPageLayout({ testID, title, onBack, backTestID, action, children, footer }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    return (
        <SafeAreaView
            testID={testID}
            edges={['top']}
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode) }]}
        >
            <PageHeader title={title} onBack={onBack} backTestID={backTestID} action={action} />
            <View style={commonStyles.navSeparator} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
            >
                {children}
            </ScrollView>
            {footer && <SafeAreaView edges={FOOTER_EDGES} style={styles.footer}>{footer}</SafeAreaView>}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacerL,
        paddingBottom: spacerXXL,
    },
    footer: {
        paddingHorizontal: spacerL,
        paddingVertical: spacerM,
    },
});

export default TariffPageLayout;
