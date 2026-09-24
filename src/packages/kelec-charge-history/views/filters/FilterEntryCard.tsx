import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, TouchableOpacity, useColorScheme, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlackColour } from "../../../../lib/graphics/utils";
import Text from "../../../../screen/Common/CustomText";
import MainContext from "../../../../lib/Contexts/MainContext";
import { Filter, FilterName } from "../../models/Filter";
import { useChargesFilters } from "../../controllers/ChargesFiltersContext";
import { getDateFilterValues, getNumericalFilterValues, getSwitchFilterValue } from "../../services/chargesFilters";
import FilterDateCard from "./FilterDateCard";
import FilterNumericalCard from "./FilterNumericalCard";
import FilterSwitchCard from "./FilterSwitchCard";

type Props = {
    readonly filter: Filter;
}

/** Ligne dépliable d'un filtre ; le contenu dépend du type de filtre. */
function FilterEntryCard({ filter }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { filters } = useChargesFilters();

    const [expanded, setExpanded] = useState(false);

    // rotation du chevron, en degrés
    const chevronRotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(chevronRotation, {
            toValue: expanded ? 0 : 180,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
        }).start();
    }, [expanded]);

    const renderFilterCard = () => {
        switch (filter.filterName) {
            case FilterName.DATE: {
                const { filterValueMin, filterValueMax } = getDateFilterValues(filter.filterName, filters);
                return <FilterDateCard filter={filter} filterValueMin={filterValueMin} filterValueMax={filterValueMax} />
            }
            case FilterName.ONLY_DC:
                return <FilterSwitchCard filter={filter} filterValue={getSwitchFilterValue(filter.filterName, filters)} />
            default: {
                const { filterValueMin, filterValueMax } = getNumericalFilterValues(filter.filterName, filters);
                return <FilterNumericalCard filter={filter} filterValueMin={filterValueMin} filterValueMax={filterValueMax} />
            }
        }
    }

    return (
        <View
            style={{
                padding: 15,
                borderRadius: 7,
            }}>
            <TouchableOpacity
                testID={"expandButton" + filter.filterName}
                onPress={() => setExpanded(!expanded)}
                style={{ marginBottom: expanded ? 10 : 0 }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{
                        color: getBlackColour(isDarkMode),
                        fontSize: 17
                    }}>
                        {languageHandler.getTranslation(filter.displayName)}
                    </Text>
                    <Animated.View style={{
                        transform: [
                            {
                                rotate: chevronRotation.interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg']
                                })
                            }
                        ]
                    }}>
                        <Icon name="expand-more" size={25} color={getBlackColour(isDarkMode)} />
                    </Animated.View>
                </View>
            </TouchableOpacity>
            {expanded && renderFilterCard()}
        </View>
    )
};

export default FilterEntryCard;
