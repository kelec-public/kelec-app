import { ActivityIndicator, FlatList, Modal, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../lib/graphics/commonStyle";
import { getBlackColour, getWhiteColour } from "../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ChargesFiltersContext from "../controllers/ChargesFiltersContext";
import { useChargesHistoryController } from "../controllers/useChargesHistoryController";
import { ChargesHistoryParams } from "../types/navigation";
import ChargeMonthSection from "./ChargeMonthSection";
import ChargesOptionsSheet from "./ChargesOptionsSheet";
import ActiveFiltersRow from "./ActiveFiltersRow";
import ChargesFiltersView from "./filters/ChargesFiltersView";

type Props = {
    readonly navigation: { goBack: () => void };
    readonly route: { params: ChargesHistoryParams };
}

function ChargesHistoryView({ navigation, route }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { charges, carType } = route.params;

    const controller = useChargesHistoryController(charges);
    const { months } = controller;

    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode), position: 'relative' }]}
            testID="ChargesView"
            edges={['top']}
        >
            <ChargesFiltersContext.Provider value={controller.filtersController}>
                <ChargesOptionsSheet
                    visible={controller.isOptionsOpen}
                    onClose={controller.closeOptions}
                    sortDesc={controller.sortDesc}
                    onToggleSort={controller.toggleSort}
                    onExport={controller.exportFilteredCharges}
                />
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={controller.isFiltersOpen}
                    onRequestClose={controller.closeFilters}
                >
                    <SafeAreaProvider>
                        <ChargesFiltersView onConfirm={controller.closeFilters} />
                    </SafeAreaProvider>
                </Modal>
                <View>
                    <View style={
                        [commonStyles.rowFlex, commonStyles.spaceBetween, commonStyles.paddingHorizontal]
                    }>
                        <TouchableOpacity
                            testID="backButton"
                            onPress={() => navigation.goBack()}>
                            <Icon name="chevron-left" size={30} color={getBlackColour(isDarkMode)} />
                        </TouchableOpacity>
                        <Text style={[styles.titleText, { color: getBlackColour(isDarkMode), flexShrink: 1, flexWrap: 'wrap' }]} numberOfLines={1} adjustsFontSizeToFit>{languageHandler.getTranslation("chargeHistory")}</Text>
                        <TouchableOpacity
                            testID="openModal"
                            onPress={controller.openOptions}
                        >
                            <Icon name="more-horiz" size={30} color={getBlackColour(isDarkMode)} />
                        </TouchableOpacity>
                    </View>
                    <ActiveFiltersRow onOpenFilters={controller.openFilters} />
                    <View style={commonStyles.navSeparator}></View>
                </View>
                <FlatList
                    data={months}
                    keyExtractor={(item) => item.monthYear}
                    renderItem={({ item: month }) => (
                        <ChargeMonthSection carType={carType} month={month} isFirst={month.monthYear === months[0].monthYear} />
                    )}
                    onEndReached={controller.loadMoreMonths}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={controller.hasMoreMonths ? <ActivityIndicator size="large" color="#0000ff" /> : null}
                />
            </ChargesFiltersContext.Provider>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    titleText: {
        textAlign: 'center',
        paddingHorizontal: 10,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
        fontSize: 25,
    },
});

export default ChargesHistoryView;
