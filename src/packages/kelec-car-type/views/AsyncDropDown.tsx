import { ActivityIndicator, useColorScheme, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import CustomDropDown, { DropDownData, DropDownType } from "../../../screen/Common/DropDown";
import { useContext, useEffect, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { spacerM } from "../../kelec-model/view/Spacers";
import { subTitle } from "../../kelec-model/view/Titles";
import { BLACK_COLOUR } from "../../kelec-model/lib/colours";

type DropDownViewProps = {
    title: string;
    dropDownType: DropDownType;
    loadOptions: () => Promise<DropDownData[]>;
    onChange: (value: DropDownData) => void;
    value: DropDownData | null;
    listener?: DropDownData,
    error?: boolean;
    testID?: string;
};

enum ViewState {
    LOADING,
    LOADED,
    ERROR
};

/** Menu déroulant dont les options sont chargées de façon asynchrone (rechargées quand `listener` change). */
const AsyncDropDown = (props: DropDownViewProps) => {
    const { languageHandler } = useContext(MainContext);

    const isDarkMode = useColorScheme() === 'dark';

    const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

    const { title, dropDownType, loadOptions, value, onChange, listener, error, testID } = props;

    const [dropDownData, setDropDownData] = useState<DropDownData[]>([]);

    useEffect(() => {
        loadData();
    }, [listener]);

    const loadData = async () => {
        try {
            const data: DropDownData[] = await loadOptions();
            setDropDownData(data);
            setViewState(ViewState.LOADED);
        } catch (_) {
            setViewState(ViewState.ERROR);
        }
    };


    const getActualDropDown = () => {
        switch (viewState) {
            case ViewState.LOADING:
                return (
                    <ActivityIndicator />
                )
            case ViewState.LOADED:
                return (
                    <CustomDropDown
                        testID={testID ?? ''}
                        placeholder={languageHandler.getTranslation("selectItem")}
                        onChange={onChange}
                        data={dropDownData}
                        value={value}
                        dropDownType={dropDownType}
                    />
                )
            case ViewState.ERROR:
                return (
                    <Text testID={dropDownType + "Error"}>Error</Text>
                )
        }
    };
    return (
        <View
            style={{
                gap: spacerM,
            }}
        >
            <Text
                style={
                    [
                        subTitle,
                        {
                            color: error && value === null ? 'red' : BLACK_COLOUR(isDarkMode),
                        }
                    ]
                }
                testID={title + "Text"}
            >
                {languageHandler.getTranslation(title)}
            </Text>
            {getActualDropDown()}
        </View>
    )
};


export default AsyncDropDown;