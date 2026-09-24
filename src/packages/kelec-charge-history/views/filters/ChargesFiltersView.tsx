import { KeyboardAvoidingView, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import Text from "../../../../screen/Common/CustomText";
import { useContext } from "react";
import MainContext from "../../../../lib/Contexts/MainContext";
import { getGrayBackgroundColour } from "../../../../lib/graphics/utils";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../lib/graphics/commonStyle";
import { SafeAreaView } from "react-native-safe-area-context";
import { getKeyboardAvoidingView } from "../../../../lib/storage/sharedPlatformsData";
import Button from '../../../kelec-model/view/Button';
import { getFiltersAvailable } from "../../models/Filter";
import FilterEntryCard from "./FilterEntryCard";

type Props = {
    readonly onConfirm: () => void;
}

/** Modale listant tous les filtres disponibles. */
function ChargesFiltersView({ onConfirm }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);

    return (
        <SafeAreaView
            style={[{ backgroundColor: getGrayBackgroundColour(isDarkMode) }, commonStyles.flex]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={getKeyboardAvoidingView()}
            >
                <View
                    style={styles.modalContent}
                    testID="filtersView"
                >
                    <ScrollView>
                        <View>
                            <Text style={styles.title}>{languageHandler.getTranslation('chargesFilters')}</Text>
                            {getFiltersAvailable().map(filter => (
                                <View key={filter.filterName}>
                                    <FilterEntryCard filter={filter} />
                                    <View style={[commonStyles.navSeparator, { marginVertical: 10 }]} />
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                    <Button
                        testID={'confirmButton'}
                        onPress={onConfirm}
                        icon={"check"}
                        text={languageHandler.getTranslation("confirm")}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    modalContent: {
        padding: 15,
        gap: 10,
        flex: 1,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 25,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold
    },
})

export default ChargesFiltersView;
