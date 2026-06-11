import { KeyboardAvoidingView, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import Text from "../../../../../Common/CustomText";
import BigButton from "../../../../../Common/BigButton";
import { useContext } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import { getGrayBackgroundColour } from "../../../../../../lib/graphics/utils";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../../lib/graphics/commonStyle";
import { SafeAreaView } from "react-native-safe-area-context";
import { Filter, getFiltersAvailable } from "../../../../../../lib/model/filters/FiltersStruct";
import { getFilterMax, getFilterMin } from "../../../../../../lib/model/filters/FiltersHandlers";
import FilterEntryCard from "./FiltersCard/FilterEntryCard";
import { getKeyboardAvoidingView } from "../../../../../../lib/storage/sharedPlatformsData";
import Button from '../../../../../../packages/kelec-model/view/Button';



type ChargesFiltersViewProps = {
    readonly setShouldOpenModal: (shouldOpenModal: boolean) => void;
    readonly handleModalAnim: (shouldOpenModal: boolean) => void;
}

function ChargesFiltersView({ setShouldOpenModal, handleModalAnim }: ChargesFiltersViewProps): React.JSX.Element {

    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);

    // filters available
    const filtersAvailable: Filter[] = getFiltersAvailable();



    return (
        <SafeAreaView
            style={
                [
                    {
                        backgroundColor: getGrayBackgroundColour(isDarkMode),
                    },
                    styles.modalView,
                    commonStyles.flex
                ]}>
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
                            <Text style={{
                                fontSize: 25,
                                fontWeight: fontWeightBold,
                                fontFamily: fontFamilyBold
                            }}>{languageHandler.getTranslation('chargesFilters')}</Text>
                            {filtersAvailable.map((filter, _) => {
                                return (
                                    <View key={filter.filterName}>
                                        <FilterEntryCard key={filter.filterName} filter={filter} filterValueMin={getFilterMin(filter)} filterValueMax={getFilterMax(filter)} />
                                        <View style={[commonStyles.navSeparator, { marginVertical: 10 }]} />
                                    </View>
                                )
                            })}
                        </View>
                    </ScrollView>
                    <Button
                        testID={'confirmButton'}
                        onPress={async () => {
                            setShouldOpenModal(false);
                            handleModalAnim(false);
                        }}
                        icon={"check"}
                        text={languageHandler.getTranslation("confirm")}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    modalView: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 1,
        shadowRadius: 16.00,
        elevation: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalContent: {
        padding: 15,
        gap: 10,
        flex: 1,
        justifyContent: 'space-between',
    },
})

export default ChargesFiltersView;