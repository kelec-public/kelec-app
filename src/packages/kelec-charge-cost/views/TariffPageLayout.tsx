import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../lib/graphics/utils";
import PageHeader, { PageHeaderAction } from "../../kelec-model/view/PageHeader";
import { spacerL, spacerXXL } from "../../kelec-model/view/Spacers";

type Props = {
    readonly testID: string;
    /** Titre déjà traduit. */
    readonly title: string;
    readonly onBack: () => void;
    readonly backTestID: string;
    readonly action: PageHeaderAction;
    readonly children: React.ReactNode;
};

/**
 * Page des tarifs : en-tête (comme l'historique de charge) puis contenu défilant.
 * La barre d'onglets reste affichée : iOS décale le bas du contenu (`contentInsetAdjustmentBehavior`),
 * et sur Android la barre réserve déjà sa hauteur.
 */
function TariffPageLayout({ testID, title, onBack, backTestID, action, children }: Props): React.JSX.Element {
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacerL,
        paddingBottom: spacerXXL,
    },
});

export default TariffPageLayout;
