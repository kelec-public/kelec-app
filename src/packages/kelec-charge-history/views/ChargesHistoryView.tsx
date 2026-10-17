import { ActivityIndicator, FlatList, Modal, View, useColorScheme } from "react-native";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../lib/graphics/utils";
import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ChargesFiltersContext from "../controllers/ChargesFiltersContext";
import { useChargesHistoryController } from "../controllers/useChargesHistoryController";
import { useChargesHistory } from "../controllers/ChargesHistoryProvider";
import ChargeMonthSection from "./ChargeMonthSection";
import ChargesOptionsSheet from "./ChargesOptionsSheet";
import ActiveFiltersRow from "./ActiveFiltersRow";
import ChargesFiltersView from "./filters/ChargesFiltersView";
import PageHeader from "../../kelec-model/view/PageHeader";

type Props = {
    readonly navigation: { goBack: () => void };
    /** Ouvre l'écran d'import (fourni par l'écran parent) ; absent : pas d'import. */
    readonly onImport?: () => void;
}

function ChargesHistoryView({ navigation, onImport }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { history, importCharges } = useChargesHistory();

    const controller = useChargesHistoryController(history);
    const { months } = controller;

    // L'import n'est proposé que si l'écran parent sait l'ouvrir et que la source sait enregistrer.
    const openImport = onImport && importCharges
        ? () => {
            controller.closeOptions();
            onImport();
        }
        : undefined;

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
                    onImport={openImport}
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
                    <PageHeader
                        title={languageHandler.getTranslation("chargeHistory")}
                        onBack={() => navigation.goBack()}
                        action={{ icon: "more-horiz", onPress: controller.openOptions, testID: "openModal" }}
                    />
                    <ActiveFiltersRow onOpenFilters={controller.openFilters} />
                    <View style={commonStyles.navSeparator}></View>
                </View>
                <FlatList
                    data={months}
                    // iOS : le contenu défile sous la barre d'onglets flottante, sans que le bas soit caché
                    contentInsetAdjustmentBehavior="automatic"
                    keyExtractor={(item) => item.monthYear}
                    renderItem={({ item: month }) => (
                        <ChargeMonthSection month={month} isFirst={month.monthYear === months[0].monthYear} />
                    )}
                    onEndReached={controller.loadMoreMonths}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={controller.hasMoreMonths ? <ActivityIndicator size="large" color="#0000ff" /> : undefined}
                />
            </ChargesFiltersContext.Provider>
        </SafeAreaView>
    )
}

export default ChargesHistoryView;
