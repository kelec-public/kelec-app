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
import { useTariffSettings } from "../../kelec-charge-cost";
import ChargeCostsContext from "../controllers/ChargeCostsContext";
import { useChargeCosts } from "../controllers/useChargeCosts";
import SetTariffBanner from "./SetTariffBanner";

type Props = {
    readonly navigation: { goBack: () => void };
    /** Ouvre l'écran d'import (fourni par l'écran parent) ; absent : pas d'import. */
    readonly onImport?: () => void;
    /** Ouvre les tarifs de l'électricité (fournis par l'écran parent) ; absent : pas d'accès aux tarifs. */
    readonly onOpenTariffs?: () => void;
}

function ChargesHistoryView({ navigation, onImport, onOpenTariffs }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { history, importCharges } = useChargesHistory();

    // relus au retour des pages des tarifs
    const [tariffSettings] = useTariffSettings();
    const costs = useChargeCosts(tariffSettings);

    const controller = useChargesHistoryController(history, costs);
    const { months } = controller;

    // L'import n'est proposé que si l'écran parent sait l'ouvrir et que la source sait enregistrer.
    const openImport = onImport && importCharges
        ? () => {
            controller.closeOptions();
            onImport();
        }
        : undefined;

    const openTariffs = onOpenTariffs
        ? () => {
            controller.closeOptions();
            onOpenTariffs();
        }
        : undefined;

    // Aucun tarif : invitation à en définir un (pas pendant la lecture des tarifs).
    const shouldSuggestTariff = !!onOpenTariffs && tariffSettings !== null && tariffSettings.tariffs.length === 0;

    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode), position: 'relative' }]}
            testID="ChargesView"
            edges={['top']}
        >
            <ChargesFiltersContext.Provider value={controller.filtersController}>
                <ChargeCostsContext.Provider value={costs}>
                    <ChargesOptionsSheet
                        visible={controller.isOptionsOpen}
                        onClose={controller.closeOptions}
                        sortDesc={controller.sortDesc}
                        onToggleSort={controller.toggleSort}
                        onExport={controller.exportFilteredCharges}
                        onImport={openImport}
                        onOpenTariffs={openTariffs}
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
                        ListHeaderComponent={shouldSuggestTariff ? <SetTariffBanner onPress={onOpenTariffs!} /> : undefined}
                        renderItem={({ item: month }) => (
                            <ChargeMonthSection month={month} isFirst={month.monthYear === months[0].monthYear} />
                        )}
                        onEndReached={controller.loadMoreMonths}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={controller.hasMoreMonths ? <ActivityIndicator size="large" color="#0000ff" /> : undefined}
                    />
                </ChargeCostsContext.Provider>
            </ChargesFiltersContext.Provider>
        </SafeAreaView>
    )
}

export default ChargesHistoryView;
