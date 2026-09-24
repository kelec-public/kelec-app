import { useContext } from "react";
import { Switch, View } from "react-native";
import Text from "../../../../screen/Common/CustomText";
import MainContext from "../../../../lib/Contexts/MainContext";
import { Filter } from "../../models/Filter";
import { useChargesFilters } from "../../controllers/ChargesFiltersContext";

type Props = {
    readonly filter: Filter;
    readonly filterValue?: boolean;
}

function FilterSwitchCard({ filter, filterValue }: Props): React.JSX.Element {
    const { applyFilter, removeFilter } = useChargesFilters();
    const { languageHandler } = useContext(MainContext);

    const onValueChange = (value: boolean) => {
        if (value) {
            applyFilter({
                displayName: filter.displayName,
                filterName: filter.filterName,
                filterType: { isActive: true },
            });
        } else {
            removeFilter(filter.filterName);
        }
    };

    return (
        <View testID={"expanded" + filter.filterName}>
            <View style={{
                flexDirection: 'row',
                gap: 10,
                flex: 1,
                justifyContent: 'space-between',
                paddingTop: 15
            }}>
                <Text>{languageHandler.getTranslation(filter.displayName)}</Text>
                <Switch
                    testID="filterSwitch"
                    value={filterValue ?? false}
                    onValueChange={onValueChange}
                />
            </View>
        </View>
    )
}

export default FilterSwitchCard;
