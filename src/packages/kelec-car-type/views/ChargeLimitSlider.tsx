import { View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import Slider from "../../kelec-model/view/Slider";
import { spacerM } from "../../kelec-model/view/Spacers";
import { subTitle } from "../../kelec-model/view/Titles";
import KelecCard from "../../kelec-model/view/Card";
import { CommonStyles } from "../../kelec-model/view/Styles";

type ChargeLimitSliderProps = {
    chargingLimit: number;
    setChargingLimit: (limit: number) => void;
}

const ChargeLimitSlider = (props: ChargeLimitSliderProps) => {
    const { languageHandler } = useContext(MainContext);

    const { chargingLimit, setChargingLimit } = props;

    return (
        <View
            style={{
                gap: spacerM
            }}
        >
            <Text
                style={subTitle}
            >
                {languageHandler.getTranslation("chargingLimitSetInTheCar")}
            </Text>
            <KelecCard>
                <View style={
                    [
                        CommonStyles.container,
                        {
                            paddingVertical: spacerM
                        }
                    ]
                }>
                    <Slider
                        sliderLevel={chargingLimit}
                        setSliderLevel={setChargingLimit}
                        stepper={5}
                        testID="chargingLimitSlider"
                        minimum={50}
                    />
                </View>
            </KelecCard>
        </View>
    )
};


export default ChargeLimitSlider;