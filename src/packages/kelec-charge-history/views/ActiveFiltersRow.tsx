import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useContext } from "react";
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import { useChargesFilters } from "../controllers/ChargesFiltersContext";
import { formatFilterLabel } from "../services/chargesFilters";

type Props = {
    readonly onOpenFilters: () => void;
}

/** Bouton "Filtres" suivi d'une pastille par filtre actif (appui = suppression). */
function ActiveFiltersRow({ onOpenFilters }: Props): React.JSX.Element {
    const theme = useTheme();
    const { languageHandler } = useContext(MainContext);
    const { filters, removeFilter } = useChargesFilters();

    const chipStyle = [styles.chip, { backgroundColor: theme.colors.secondaryContainer }];
    const chipTextStyle = [styles.chipText, { color: theme.colors.onSecondaryContainer }];

    return (
        <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
        >
            <View style={styles.row}>
                <TouchableOpacity
                    testID="showFiltersButton"
                    onPress={onOpenFilters}
                    style={[chipStyle, { minWidth: 100 }]}
                >
                    <Icon name="filter-list" size={15} color={theme.colors.onSecondaryContainer} />
                    <Text numberOfLines={1} style={chipTextStyle}>
                        {languageHandler.getTranslation("filters")}
                    </Text>
                </TouchableOpacity>
                {filters.map(filter => (
                    <TouchableOpacity
                        onPress={() => removeFilter(filter.filterName)}
                        testID="filterListButton"
                        style={[chipStyle, { gap: 7 }]}
                        key={filter.filterName}
                    >
                        <Text style={chipTextStyle}>{formatFilterLabel(filter, key => languageHandler.getTranslation(key))}
                        </Text>
                        <Icon name="close" size={15} color={theme.colors.onSecondaryContainer} style={{ marginTop: 2 }} />
                    </TouchableOpacity>
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
    chipText: {
        fontSize: 15,
        marginLeft: 10,
    },
});

export default ActiveFiltersRow;
