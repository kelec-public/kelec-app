import { TextInput, useColorScheme, View } from "react-native";
import { getBlackColour } from "../../../../../../../lib/graphics/utils";
import Text from "../../../../../../Common/CustomText";
import { useContext, useEffect, useState } from "react";
import { Filter, FilterNumerical } from "../../../../../../../lib/model/filters/FiltersStruct";
import ChargesViewContext from "../../../../../../../lib/Contexts/ChargesViewContext";
import { useTheme } from '@react-navigation/native';

type FilterCardProps = {
    readonly filter: Filter;
    readonly filterValueMin?: number; // if the filter is already applied
    readonly filterValueMax?: number; // if the filter is already applied
}

function FilterNumericalCard({ filter, filterValueMin, filterValueMax }: FilterCardProps): React.JSX.Element {

    const { applyFilter, removeFilter } = useContext(ChargesViewContext);

    const getFilterDetails = () => {
        return filter.filterType as FilterNumerical
    }

    useEffect(() => {
        if (filterValueMin !== undefined && filterValueMin !== 0)
            setLeftValue(filterValueMin + '');
        if (filterValueMax !== undefined && filterValueMax !== 9999)
            setRightValue(filterValueMax + '');
    }, []);

    // filter values
    const [leftValue, setLeftValue] = useState("");
    const [rightValue, setRightValue] = useState("");

    const isDarkMode = useColorScheme() === 'dark';

    return (

        <View
            style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}
            testID={"expanded" + filter.filterName}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 15,
                    borderRadius: 5,
                    backgroundColor: useTheme().colors.background
                }}>
                    <TextInput
                        style={{
                            borderBottomWidth: 1,
                            borderBottomColor: 'gray',
                            padding: 10,
                            width: 70,
                            marginRight: 10,
                            textAlign: 'center',
                            color: getBlackColour(isDarkMode)
                        }}
                        keyboardType="numeric"
                        value={leftValue + ''}
                        testID={"leftTextInput" + filter.filterName}
                        onChangeText={(text) => {
                            // remove invalid caracters
                            let value = text.replace(/\D/g, '');
                            // check if the value is invalid (greater than the right value)
                            const min = parseInt(value) > 9999 ? '9998' : value;
                            setLeftValue(min);
                            const max = rightValue !== "" ? parseInt(rightValue) : 9999;
                            if (value !== "") {
                                const filterToApply: Filter = {
                                    displayName: filter.displayName,
                                    filterName: filter.filterName,
                                    filterType: {
                                        min: parseInt(value),
                                        max: max,
                                        unit: getFilterDetails().unit
                                    }
                                }
                                applyFilter(filterToApply);
                            }
                            if (text == "" && rightValue == "") removeFilter(filter.filterName);

                        }}
                        placeholder={getFilterDetails().min + ''}
                    />
                    <Text style={{ color: getBlackColour(isDarkMode) }}>{getFilterDetails().unit}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 15,
                    borderRadius: 5,
                    backgroundColor: useTheme().colors.background

                }}>
                    <TextInput
                        style={{
                            borderBottomWidth: 1,
                            borderBottomColor: 'gray',
                            padding: 10,
                            width: 70,
                            marginRight: 10,
                            textAlign: 'center',
                            color: getBlackColour(isDarkMode)
                        }}
                        keyboardType="numeric"
                        testID={"rightTextInput" + filter.filterName}
                        value={rightValue + ''}
                        onChangeText={(text) => {
                            let value = text.replace(/\D/g, '');
                            const max = parseInt(value) > 9999 ? '9998' : value;
                            setRightValue(max);
                            const min = leftValue !== "" ? parseInt(leftValue) : 0;
                            if (value !== "") {
                                const filterToApply: Filter = {
                                    filterType: {
                                        min: min,
                                        max: parseInt(max),
                                        unit: getFilterDetails().unit
                                    },
                                    displayName: filter.displayName,
                                    filterName: filter.filterName
                                }
                                applyFilter(filterToApply);
                            }
                            if (text == "" && leftValue == "") removeFilter(filter.filterName);
                        }}
                        placeholder={getFilterDetails().max + ''}
                    />
                    <Text style={{ color: getBlackColour(isDarkMode) }}>{getFilterDetails().unit}</Text>
                </View>
            </View>
        </View>
    )
}

export default FilterNumericalCard;