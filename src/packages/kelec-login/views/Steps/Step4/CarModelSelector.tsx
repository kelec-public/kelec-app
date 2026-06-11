import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../LoginEntryView";
import { Edge } from "react-native-safe-area-context";
import { Image, Linking, StyleSheet, Switch, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";
import { useContext, useEffect, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import Text from "../../../../../screen/Common/CustomText";
import { BLACK_COLOUR, PRIMARY_COLOUR } from "../../../../kelec-model/lib/colours"; import { DropDownData, DropDownType } from "../../../../../screen/Common/DropDown";
import KelecApiHandler, { BatteryApi, BrandApi, ModelApi } from "../../../../../lib/clients/kelec-api/kelecApiHandler";
import ChargeLimitSlider from "./ChargeLimitSlider";
import CarType, { AUTHORISED_MODELS, CarAvailableModels, LeasingData } from "../../../../../lib/clients/cars/carTypes/carType";
import CarModel from "../../../../../lib/clients/cars/carModel";
import CarModelChoiceLeasing, { RowView } from "./CarModelChoiceLeasing";
import LoginDefaultView from "../../LoginDefaultView";
import DropDownView from "./DropDownView";
import { spacerL, spacerM, spacerXL } from "../../../../kelec-model/view/Spacers";
import KelecCard from "../../../../kelec-model/view/Card";
import Icon from "react-native-vector-icons/MaterialIcons";
import { textBody } from "../../../../kelec-model/view/Titles";
import { CommonStyles } from "../../../../kelec-model/view/Styles";


export type CarModelSelectorParamList = {
    carModel: CarModel;
    onConfirmUpdate: () => Promise<void>;
    title: string;
    subTitle?: string
    nextButtonText?: string;
    safeAreaEdges?: Edge[];
}

type Props = NativeStackScreenProps<LoginEntryParamList, 'CarModelSelector'>;

const CarModelSelector = (props: Props) => {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler, storageHandler } = useContext(MainContext);

    const { navigation, route } = props;
    const { carModel, onConfirmUpdate, title, subTitle, nextButtonText, safeAreaEdges } = route.params;



    // for the fields
    const [selectedBrand, setSelectedBrand] = useState<DropDownData | null>(null);
    const [selectedModel, setSelectedModel] = useState<DropDownData | null>(null);
    const [selectedBattery, setSelectedBattery] = useState<DropDownData | null>(null);
    const [chargingLimit, setChargingLimit] = useState<number>(100);
    const [leasingData, setLeasingData] = useState<LeasingData | undefined>(undefined);
    const [supportsV2G, setSupportsV2G] = useState<boolean>(false);

    const [isError, setIsError] = useState(false); // true is user tried to submit without filling all fields

    const formatBatteryLabel = (battery: BatteryApi): string => {
        let str = `${battery.size} kWh / AC ${battery.max_ac_power} kW`;
        if (battery.max_dc_power > 0) {
            str += ` / DC ${battery.max_dc_power} kW`;
        }
        return str;
    }


    // load previously saved values
    useEffect(() => {
        loadCurrentCarType();

    }, [carModel.getVin()]);

    const loadCurrentCarType = async () => {
        const currentCarType = await storageHandler.getCarType(carModel.getVin());
        if (currentCarType) {
            setSelectedBrand({
                testID: currentCarType.getBrand().name + 'TestId',
                label: currentCarType.getBrand().display_name,
                value: currentCarType.getBrand().name,
                apiData: currentCarType.getBrand()
            });
            setSelectedModel({
                testID: currentCarType.getCarModel().name + 'TestId',
                label: currentCarType.getCarModel().display_name,
                value: currentCarType.getCarModel().name,
                additionalProp: currentCarType.getCarModel().engine_type,
                apiData: currentCarType.getCarModel()
            });
            const storedBattery: BatteryApi = {
                size: currentCarType.getBatterySize(),
                max_ac_power: currentCarType.getMaxAcCharging(),
                max_dc_power: currentCarType.getMaxDcCharging(),
            };
            setSelectedBattery({
                testID: `${storedBattery.size}-${storedBattery.max_ac_power}-${storedBattery.max_dc_power}-TestId`,
                label: formatBatteryLabel(storedBattery),
                value: 0,
                apiData: storedBattery
            });
            setLeasingData(currentCarType.getLeasingData());
            setChargingLimit(currentCarType.getChargingLimit());
            setSupportsV2G(currentCarType.getSupportsV2G());
        };
    }

    const checkIsValid = (): boolean => {
        let isValid = true;
        if (selectedBrand == null || selectedModel == null || selectedBattery == null) {
            isValid = false;
        }

        if (leasingData) {
            if (leasingData.startDate == null || leasingData.endDate == null || leasingData.totalMileage == null) {
                isValid = false;
            }
        }

        return isValid;
    };

    return (
        <LoginDefaultView
            testID="carModelChoiceStep"
            title={title}
            subtitle={subTitle}
            safeAreaEdges={safeAreaEdges}
            onPrevious={() => {
                navigation.goBack();
            }}
            nextButtonTestID="confirmCarModelChoice"
            onNext={async () => {
                const isValid = checkIsValid();

                if (!isValid) {
                    setIsError(true);
                    return;
                }
                const newCarType = new CarType({
                    brand: selectedBrand?.apiData as BrandApi,
                    model: selectedModel?.apiData as ModelApi,
                    battery: selectedBattery?.apiData as BatteryApi,
                    chargingLimit: chargingLimit,
                    leasing: leasingData,
                    supportsV2G: supportsV2G,
                })
                await storageHandler.setCarType(carModel.getVin(), newCarType);
                onConfirmUpdate();
            }}
            nextButtonText={nextButtonText}

        >
            <View
                style={{
                    gap: spacerM,
                }}
            >

                <Image
                    source={{ uri: carModel.getImageUrl() }}
                    style={styles.mainCarImage}
                />

                <DropDownView
                    testID="brandDropdown"
                    title="carBrand"
                    dropDownType={DropDownType.BRAND}
                    loadOptions={async () => {
                        const kelecApiHandler = new KelecApiHandler();
                        const brands = await kelecApiHandler.getBrands();
                        const dropDownData: DropDownData[] = brands.map(brand => {
                            return { testID: brand.name + 'TestId', label: brand.display_name, value: brand.name, apiData: brand };
                        })
                        return dropDownData;
                    }}
                    value={selectedBrand}
                    onChange={(value: DropDownData) => {
                        setSelectedBrand(value);
                        setSelectedModel(null);
                        setSelectedBattery(null);
                    }}
                    error={isError}
                />

                {selectedBrand && (
                    <DropDownView
                        testID="modelDropdown"
                        title="carModel"
                        dropDownType={DropDownType.MODEL}
                        loadOptions={async () => {
                            const kelecApiHandler = new KelecApiHandler();
                            const models = await kelecApiHandler.getModels(selectedBrand.value as string);
                            const dropDownData: DropDownData[] = models.map(model => {
                                return { testID: model.name + 'TestId', label: model.display_name, value: model.name, additionalProp: model.engine_type, apiData: model };
                            });
                            return dropDownData;
                        }}
                        value={selectedModel}
                        onChange={(value: DropDownData) => {
                            setSelectedModel(value);
                            setSelectedBattery(null);
                        }}
                        listener={selectedBrand}
                        error={isError}
                    />
                )}

                {selectedModel && (
                    <DropDownView
                        testID="batteryDropdown"
                        title="battery"
                        dropDownType={DropDownType.BATTERY}
                        loadOptions={async () => {
                            const kelecApiHandler = new KelecApiHandler();
                            const batteries = await kelecApiHandler.getBatteries(selectedBrand!.value as string, selectedModel!.value as string);
                            const dropDownData: DropDownData[] = batteries.map((battery, index) => {
                                return { testID: `${battery.size}-${battery.max_ac_power}-${battery.max_dc_power}-TestId`, label: formatBatteryLabel(battery), value: index, apiData: battery };
                            })
                            return dropDownData;
                        }}
                        value={selectedBattery}
                        onChange={(value: DropDownData) => {
                            setSelectedBattery(value);
                        }}
                        listener={selectedModel}
                        error={isError}
                    />
                )}

                <TouchableOpacity
                    testID="carNotListedButton"
                    onPress={() => {
                        (async () => {
                            Linking.openURL('mailto:contact@kelec.app?subject=Kelec new model&body=I have the following 100% electric cars that is not listed in Kelec: ');
                        })();
                    }}
                >
                    <Text
                        style={
                            [
                                subTitle,
                                styles.inlineButton
                            ]
                        }
                    >
                        {languageHandler.getTranslation("myCarIsNotListed")}
                    </Text>
                </TouchableOpacity>

                {selectedBattery && AUTHORISED_MODELS.includes(selectedModel?.value as CarAvailableModels) && (
                    <ChargeLimitSlider chargingLimit={chargingLimit} setChargingLimit={setChargingLimit} />
                )}

                <CarModelChoiceLeasing isError={isError} leasingData={leasingData} setLeasingData={setLeasingData} />

                <KelecCard>
                    <View
                        style={
                            [
                                CommonStyles.container,
                                {
                                    padding: spacerM,
                                    gap: spacerL,

                                }
                            ]
                        }>
                        <RowView>
                            <TouchableWithoutFeedback
                                testID="V2GCompatibleSwitch"
                                onPress={() => {
                                    setSupportsV2G(!supportsV2G);
                                }}
                            >
                                <View
                                    style={
                                        styles.settingText
                                    }
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: spacerM
                                        }}
                                    >
                                        <Icon
                                            name="ev-station"
                                            size={spacerXL}
                                            color={BLACK_COLOUR(isDarkMode)}
                                        />
                                        <Text style={
                                            [
                                                textBody,
                                                {
                                                    flexShrink: 1,
                                                    flexWrap: 'wrap',
                                                }
                                            ]
                                        }>
                                            {languageHandler.getTranslation("myCarSupportsV2G")}
                                        </Text>
                                    </View>
                                    <Switch

                                        value={supportsV2G}
                                        onValueChange={() => {
                                            setSupportsV2G(!supportsV2G);
                                        }}
                                        trackColor={{ true: PRIMARY_COLOUR }}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </RowView>
                    </View>
                </KelecCard>
            </View >
        </LoginDefaultView >
    );
};


const styles = StyleSheet.create({
    mainCarImage: {
        width: '100%',
        height: 180,
        resizeMode: 'contain',
    },
    inlineButton: {
        color: PRIMARY_COLOUR,
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    settingText: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM
    },
    leftText: {
        flexWrap: 'wrap',
        flexShrink: 1
    },
});

export default CarModelSelector;