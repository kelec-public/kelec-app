import { useEffect, useState } from "react";
import { View } from "react-native";
import DatePickerField from "../../../../screen/loggedIn/CarsTab/CarView/Elements/DatePicker";
import { Filter } from "../../models/Filter";
import { useChargesFilters } from "../../controllers/ChargesFiltersContext";

type Props = {
    readonly filter: Filter;
    readonly filterValueMin?: Date;
    readonly filterValueMax?: Date;
}

function FilterDateCard({ filter, filterValueMin, filterValueMax }: Props): React.JSX.Element {
    const { applyFilter, removeFilter } = useChargesFilters();

    // initialisées avec le filtre déjà appliqué, s'il existe
    const [startDate, setStartDate] = useState<Date | undefined>(filterValueMin);
    const [endDate, setEndDate] = useState<Date | undefined>(filterValueMax);

    useEffect(() => {
        if (!startDate && !endDate) {
            removeFilter(filter.filterName);
            return;
        }
        applyFilter({
            displayName: filter.displayName,
            filterName: filter.filterName,
            filterType: { startDate, endDate },
        });
    }, [startDate, endDate]);

    return (
        <View testID={"expanded" + filter.filterName}>
            <View style={{
                flexDirection: 'row',
                gap: 10,
                flex: 1,
                justifyContent: 'space-between'
            }}>
                <DatePickerField
                    updateDate={setStartDate}
                    dateValue={startDate}
                    placeholder={"start_date"}
                />
                <DatePickerField
                    updateDate={setEndDate}
                    dateValue={endDate}
                    placeholder={"end_date"}
                />
            </View>
        </View>
    )
}

export default FilterDateCard;
