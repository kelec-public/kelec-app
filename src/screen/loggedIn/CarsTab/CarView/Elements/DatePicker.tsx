import { Platform, TouchableOpacity, useColorScheme, View } from "react-native";
import Text from "../../../../Common/CustomText";
import { getBlackColour } from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';

type Props = {
    readonly updateDate: (date: Date) => void;
    readonly dateValue?: Date;
    readonly placeholder: string;
}

function DatePickerField({ updateDate, dateValue, placeholder }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme()
    const { languageHandler } = useContext(MainContext);

    const [datePickerVisible, setDatePickerVisible] = useState<boolean>(false);

    const getDate = (): Date | undefined => {
        return dateValue ? new Date(dateValue) : undefined;
    }

    const displayButton = (date: Date | undefined, openModal: () => {}) => {
        return (
            <TouchableOpacity
                onPress={openModal}
                style={{
                    flex: 1,
                }}
                testID={"dateButton" + placeholder}
            >
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 15,
                    borderRadius: 5,
                    backgroundColor: theme.colors.background

                }}>
                    <Text
                        style={{
                            fontSize: 16,
                            flexShrink: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {date ? date.toLocaleDateString() : languageHandler.getTranslation(placeholder)}
                    </Text>
                    <Icon name="calendar-today" size={24} color={getBlackColour(isDarkMode)} />
                </View>
            </TouchableOpacity>
        );
    };

    const closeModal = () => {
        setDatePickerVisible(false);
    };

    return (
        <View>
            {displayButton(getDate(), async () => {
                if (Platform.OS === 'android') {
                    DateTimePickerAndroid.open({
                        value: getDate() ?? new Date(),
                        mode: 'date',
                        onChange: (event, selectedDate) => {
                            if (selectedDate) {
                                updateDate(selectedDate);
                            }
                        },
                    })
                }
                if (Platform.OS === 'ios') {
                    setDatePickerVisible(true)
                }

            }
            )}
            {datePickerVisible && (
                <DateTimePicker
                    value={getDate() ?? new Date()}
                    mode={"date"}
                    display="default"
                    onChange={(_, selectedDate) => {
                        if (selectedDate) {
                            updateDate(selectedDate);
                        }
                        closeModal();
                    }}
                />
            )}
        </View>
    );
}

export default DatePickerField;