import { ScrollView, StyleSheet, View } from "react-native";
import { useContext } from "react";
import { useTheme } from '@react-navigation/native';
import MainContext from "../../../lib/Contexts/MainContext";
import { useChargesFilters } from "../controllers/ChargesFiltersContext";
import { formatFilterLabel } from "../services/chargesFilters";
import GlassButton from "../../kelec-model/view/GlassButton";

type Props = {
    readonly onOpenFilters: () => void;
}

/** Bouton "Filtres" suivi d'une pastille par filtre actif (appui = suppression). */
function ActiveFiltersRow({ onOpenFilters }: Props): React.JSX.Element {
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const { filters, removeFilter } = useChargesFilters();

    const chipStyle = [styles.chip, { backgroundColor: theme.colors.secondaryContainer }];

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
        >
            <View style={styles.row}>
                <GlassButton
                    testID="showFiltersButton"
                    icon="filter-list"
                    iconSize={15}
                    iconPosition="start"
                    text={languageHandler.getTranslation("filters")}
                    textStyle={styles.chipText}
                    onPress={onOpenFilters}
                    glassStyle={[styles.chip, styles.filtersChip]}
                    fallbackStyle={[chipStyle, styles.filtersChip]}
                    fallbackIconColour={theme.colors.onSecondaryContainer}
                    fallbackTextColour={theme.colors.onSecondaryContainer}
                />
                {filters.map(filter => (
                    <GlassButton
                        key={filter.filterName}
                        testID="filterListButton"
                        icon="close"
                        iconSize={15}
                        iconStyle={styles.removeIcon}
                        text={formatFilterLabel(filter, key => languageHandler.getTranslation(key))}
                        textStyle={styles.chipText}
                        onPress={() => removeFilter(filter.filterName)}
                        glassStyle={styles.chip}
                        fallbackStyle={chipStyle}
                        fallbackIconColour={theme.colors.onSecondaryContainer}
                        fallbackTextColour={theme.colors.onSecondaryContainer}
                    />
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        padding: 10,
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    filtersChip: {
        minWidth: 100,
    },
    chipText: {
        fontSize: 15,
        marginLeft: 10,
    },
    removeIcon: {
        marginTop: 2,
        marginLeft: 7,
    },
});

export default ActiveFiltersRow;
