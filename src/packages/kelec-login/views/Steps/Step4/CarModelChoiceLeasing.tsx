import { useContext } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { LeasingData } from "../../../../../lib/clients/cars/carTypes/carType";
import Text from "../../../../../screen/Common/CustomText";
import DatePickerField from "../../../../../screen/loggedIn/CarsTab/CarView/Elements/DatePicker";
import TextInput from "../../../../../screen/Common/TextInput";
import SwitchCard from "../../../../kelec-model/view/SwitchCard";
import SpacedRow from "../../../../kelec-model/view/SpacedRow";
import { spacerL, spacerM } from "../../../../kelec-model/view/Spacers";
import { BLACK_COLOUR } from "../../../../kelec-model/lib/colours";
import { subTitle } from "../../../../kelec-model/view/Titles";

type Props = {
    readonly isError: boolean,
    readonly leasingData: LeasingData | undefined,
    readonly setLeasingData: (leasingData: LeasingData | undefined) => void,
}

const CarModelChoiceLeasing = ({ isError, leasingData, setLeasingData }: Props) => {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);


    const handleLeasingSwitchChange = (enabled: boolean) => {
        setLeasingData(enabled ? {} : undefined);
    };

    return (
        <SwitchCard
            testID="leasingSwitch"
            icon="car-rental"
            label={languageHandler.getTranslation("myCarIsLeasing")}
            value={leasingData !== undefined}
            onValueChange={handleLeasingSwitchChange}
        >
            {leasingData && (
                <View
                    style={{
                        gap: spacerM
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: spacerL,
                            flex: 1,
                        }}
                    >
                        <View
                            style={{
                                gap: spacerM,
                                flex: 1,
                            }}
                        >
                            <Text
                                testID="leasingStartDate"
                                style={
                                    [
                                        subTitle,
                                        styles.leftText,
                                        {
                                            color: isError && leasingData?.startDate == null ? 'red' : BLACK_COLOUR(isDarkMode),
                                        }
                                    ]
                                }
                            >
                                {languageHandler.getTranslation("leasingStartDate")}
                            </Text>
                            <DatePickerField
                                updateDate={(date: Date) => {
                                    setLeasingData({ ...leasingData, startDate: date })
                                }}
                                dateValue={leasingData?.startDate}
                                placeholder={"start_date"}
                            />
                        </View>
                        <View
                            style={{
                                gap: spacerM,
                                flex: 1,
                            }}
                        >
                            <Text
                                testID="leasingEndDate"
                                style={
                                    [
                                        subTitle,
                                        styles.leftText,
                                        {
                                            color: isError && leasingData?.endDate == null ? 'red' : BLACK_COLOUR(isDarkMode),
                                        }
                                    ]
                                }
                            >
                                {languageHandler.getTranslation("leasingEndDate")}
                            </Text>
                            <DatePickerField
                                updateDate={(date: Date) => {
                                    setLeasingData({ ...leasingData, endDate: date })
                                }}
                                dateValue={leasingData?.endDate}
                                placeholder={"end_date"}
                            />
                        </View>

                    </View>
                    <SpacedRow>
                        <Text
                            testID="totalMileageAllowed"
                            style={
                                [
                                    subTitle,
                                    styles.leftText,
                                    {
                                        color: isError && leasingData?.totalMileage == null ? 'red' : BLACK_COLOUR(isDarkMode),
                                    }
                                ]
                            }
                        >
                            {languageHandler.getTranslation("totalMileageAllowed")}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <TextInput
                                testID="totalMileageAllowedInput"
                                placeholder={languageHandler.getTranslation("1 234")}
                                value={leasingData?.totalMileage?.toString()}
                                onChangeText={(text) => {
                                    // to update
                                    let value = text.replace(/\D/g, '');
                                    const mileage = parseInt(value);
                                    if (!isNaN(mileage)) {
                                        setLeasingData({ ...leasingData, totalMileage: mileage })
                                    } else {
                                        setLeasingData({ ...leasingData, totalMileage: undefined })
                                    }
                                }}
                                keyboardType="numeric"
                            />
                            <Text>km/mi</Text>
                        </View>
                    </SpacedRow>
                    <SpacedRow>
                        <Text
                            testID="mileageAtStart"
                            style={
                                [
                                    subTitle,
                                    styles.leftText,
                                    {
                                        color: isError && leasingData?.startMileage == null ? 'red' : BLACK_COLOUR(isDarkMode),
                                    }
                                ]
                            }
                        >
                            {languageHandler.getTranslation("mileageAtStart")}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <TextInput
                                testID="mileageAtStartInput"
                                placeholder={languageHandler.getTranslation("1 234")}
                                value={leasingData?.startMileage?.toString()}
                                onChangeText={(text) => {
                                    // to update
                                    let value = text.replace(/\D/g, '');
                                    const mileage = parseInt(value);
                                    if (!isNaN(mileage)) {
                                        setLeasingData({ ...leasingData, startMileage: mileage })
                                    } else {
                                        setLeasingData({ ...leasingData, startMileage: undefined })
                                    }
                                }}
                                keyboardType="numeric"
                            />
                            <Text>km/mi</Text>
                        </View>
                    </SpacedRow>
                </View>
            )}
        </SwitchCard>
    )
};

const styles = StyleSheet.create({
    leftText: {
        flexWrap: 'wrap',
        flexShrink: 1
    },
});

export default CarModelChoiceLeasing;