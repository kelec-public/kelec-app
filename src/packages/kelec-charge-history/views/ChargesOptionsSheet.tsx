import { StyleSheet, View } from "react-native";
import { useContext } from "react";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import BottomSheet from "../../../screen/Common/bottomSheet/BottomSheet";
import Button from '../../kelec-model/view/Button';

type Props = {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly sortDesc: boolean;
    readonly onToggleSort: () => void;
    readonly onExport: () => void;
}

/** Feuille "…" de l'historique : tri et export. */
function ChargesOptionsSheet({ visible, onClose, sortDesc, onToggleSort, onExport }: Props): React.JSX.Element {
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);

    return (
        <BottomSheet
            title={languageHandler.getTranslation("chargeHistory")}
            testID="chargesViewModal"
            onClose={onClose}
            visible={visible}
        >
            <View style={styles.modalContent}>
                <Button
                    testID={'sortButton'}
                    onPress={onToggleSort}
                    icon="sort"
                    text={sortDesc ? languageHandler.getTranslation("sortNewerToOlder")
                        : languageHandler.getTranslation("sortOlderToNewer")}
                    buttonStyle={theme.buttons.neutral}
                />
                <Button
                    testID={'exportButton'}
                    onPress={onExport}
                    icon={"ios-share"}
                    text={languageHandler.getTranslation("export")}
                    buttonStyle={theme.buttons.neutral}
                />
            </View>
        </BottomSheet>
    )
}

const styles = StyleSheet.create({
    modalContent: {
        marginTop: 10,
        gap: 10
    },
});

export default ChargesOptionsSheet;
