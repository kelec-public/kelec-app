import React, { useContext } from "react";
import { useColorScheme, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../../../CarsPageView";
import { SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import { getWhiteColour } from "../../../../../../lib/graphics/utils";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import TopNavHeader from "../../../../../Common/Navigation/TopNavHeader";

type ImportViewProps = NativeStackScreenProps<CarsViewParamList, 'ImportChargesView'>;

function ImportChargesView({ navigation, route }: ImportViewProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);

    return (
        <SafeAreaView
            style={[commonStyles.flex, { backgroundColor: getWhiteColour(isDarkMode) }]}
            testID="ImportChargesView"
        >
            <TopNavHeader
                navigation={navigation}
                title={languageHandler.getTranslation("importCharges")}
                rightIcon={
                    <View style={{ width: 30 }} />
                }
            ></TopNavHeader>
        </SafeAreaView>
    )
}

export default ImportChargesView;