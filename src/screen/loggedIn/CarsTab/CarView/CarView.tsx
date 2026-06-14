import { StyleSheet, View, ScrollView, useColorScheme, RefreshControl, TouchableOpacity, Alert } from "react-native";
import Text from "../../../../screen/Common/CustomText";
import { useContext, useEffect, useMemo, useState } from "react";
import MainContext from "../../../../lib/Contexts/MainContext";
import CarModel from "../../../../lib/clients/cars/carModel";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBlackColour, getDisplayDate, getMainInterfaceBackground } from "../../../../lib/graphics/utils";
import SummaryCard from "./Elements/SummaryCard";
import CarViewContext from "../../../../lib/Contexts/CarViewContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiHandler from "../../../../lib/clients/apiHandlers/apiHandler";
import commonStyles from "../../../../lib/graphics/commonStyle";
import CarType from "../../../../lib/clients/cars/carTypes/carType";
import Account, { CarMaker } from "../../../../lib/clients/accounts/account";
import FullScreenError, { getErrorMessage } from "../../../../FullScreenError";
import FullScreenLoading from "../../../../FullScreenLoading";
import RenaultApiHandler from "../../../../lib/clients/apiHandlers/renaultApiHandler";
import HyundaiApiHandler from "../../../../lib/clients/apiHandlers/hyundaiApiHandler";
import MapCard from "./Elements/MapCard";
import HVACCard from "./Elements/HVACCard";
import MainChargesCard from "./ChargesView.tsx/MainChargesCard";
import BatteryCard from "./Elements/BatteryCard";
import { getNativeBatteryStatus, refreshWidget } from "../../../../lib/storage/sharedPlatformsData";
import ChargesStorageController from "../../../../lib/storage/chargesHandler";
import Icon from 'react-native-vector-icons/MaterialIcons';
import CarsViewContext from "../../../../lib/Contexts/CarsViewContext";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import RenaultCharge from "../../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import { CarMakerClientErrors } from "../../../../lib/clients/carMakers/carMakerClient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../CarsPageView";
import { TfaOrigin } from "../../../../packages/kelec-login/views/Steps/Step2/Tfa/TfaView";
import BottomSheet from "../../../Common/bottomSheet/BottomSheet";
import QuickSwitchView from "./Elements/QuickSwitch/QuickSwitchView";

enum ViewState {
    LOADING = 'LOADING',
    ERROR = 'ERROR',
    LOADED = 'LOADED',
}

type CarViewProps = NativeStackScreenProps<CarsViewParamList, "CarView"> & {
    carModel: CarModel;
    account: Account;
    pagerRef: React.RefObject<PagerView | null>;
    tfaInProgress: React.RefObject<boolean>;
}

function CarView({ carModel, navigation, account, pagerRef, tfaInProgress }: CarViewProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    useEffect(() => {
        loadCarData();
    }, []);

    const [shouldDisplayCarChoice, setShouldDisplayCarChoice] = useState<boolean>(false);
    const { handleModalAnim } = useContext(CarsViewContext);

    const { currentUser } = useContext(MainContext);
    const { storageHandler, languageHandler } = useContext(MainContext);
    const loadCarModel = async (): Promise<void> => {
        // load image
        const image = await AsyncStorage.getItem(`${carModel.getVin()}/image`);
        if (image) {
            setImage(image);
        }

        // load stored car type 
        const carType = await storageHandler.getCarType(carModel.getVin());
        if (carType) {
            setCarType(carType);
        }
    };

    /* CAR MAKER LOADERS */
    const loadDemoCar = (): void => {
        const apiHandler: ApiHandler = storageHandler.buildApiHandler(carModel.getCarmaker());
        const mockData = require('../../../../assets/car_data/mockDemoData.json');
        apiHandler.setApiData({
            hasError: false,
            apiData: mockData.battery
        })
        apiHandler.setCockpitStatus!({
            hasError: false,
            apiData: mockData.cockpit
        })
        apiHandler.setLocationStatus!({
            hasError: false,
            apiData: mockData.map
        })
        const charges = storageHandler.buildCharges(mockData.charges);
        apiHandler.setChargesHistory!({
            hasError: false,
            apiData: charges,
        });
        setApiHandler(apiHandler);
        setViewState(ViewState.LOADED);
    }

    const loadHyundaiCar = async (): Promise<void> => {
        // load from local
        const localApiHandler: ApiHandler = storageHandler.buildApiHandler(carModel.getCarmaker());
        // load car data
        let data = await storageHandler.getStoredApiData(carModel.getVin());
        if (data) {
            localApiHandler.setApiData(data);
        }
        // trigger a re-render
        if (!localApiHandler.hasError()) {
            setApiHandler(localApiHandler);
            setViewState(ViewState.LOADED);
        }

        // load from api
        const remoteApiHandler: ApiHandler = new HyundaiApiHandler();
        remoteApiHandler.setApiData(data ?? { hasError: true });
        const carData = await account.fetchCarStatus(carModel.getVin());
        if (!carData.hasError) {
            remoteApiHandler.setApiData(carData);
            await storageHandler.storeApiData(carData, carModel.getVin());
        }
        // trigger a re-render
        setApiHandler(remoteApiHandler);
        // in case the data has been fetched from locale
        if (!remoteApiHandler.hasError() && viewState == ViewState.LOADING) {
            setViewState(ViewState.LOADED);
        }
        // in case no data has been fetched
        if (remoteApiHandler.hasError() && viewState == ViewState.LOADING) {
            setViewState(ViewState.ERROR);
        }
    }

    const loadRenaultCar = async (): Promise<void> => {
        // load from local
        const localApiHandler: ApiHandler = storageHandler.buildApiHandler(carModel.getCarmaker());
        // load battery status
        let data = await storageHandler.getStoredApiData(carModel.getVin());
        if (data) {
            // weird bug in first gen zoe
            if (data.apiData.chargingStatus == -1.1 && data.apiData.batteryLevel < 100) {
                data.apiData.chargingStatus = 1.0;
            }
            localApiHandler.setApiData(data);
        }


        try {
            // load battery status from widget cache
            const widgetData = await getNativeBatteryStatus(carModel.getVin());
            if (widgetData) {
                const parsedWidgetData = JSON.parse(widgetData);
                if (localApiHandler.getLastUpdateDate() < new Date(parsedWidgetData.timestamp)) {
                    localApiHandler.setApiData({
                        hasError: false,
                        apiData: parsedWidgetData
                    });
                }
            }
        } catch (error) {
            console.error('Error loading widget data for car ' + carModel.getVin() + ': ', error);
        }

        // load cockpit status
        let cockpitData = await storageHandler.getStoredApiData(carModel.getVin(), 'cockpitStatus');
        if (cockpitData && localApiHandler.setCockpitStatus)
            localApiHandler.setCockpitStatus(cockpitData);
        // load location status
        let locationStatus = await storageHandler.getStoredApiData(carModel.getVin(), 'locationStatus');
        if (locationStatus && localApiHandler.setLocationStatus)
            localApiHandler.setLocationStatus(locationStatus);
        // load charges history
        let chargesHistory = await ChargesStorageController.getCharges(carModel.getVin());
        if (chargesHistory && localApiHandler.setChargesHistory) {
            localApiHandler.setChargesHistory({
                hasError: false,
                apiData: chargesHistory,
            });
        }
        // load charges settings
        let chargesSettings = await storageHandler.getStoredApiData(carModel.getVin(), 'chargesSettings');
        if (chargesSettings && localApiHandler.setChargingSettings) {
            localApiHandler.setChargingSettings(chargesSettings);
        }

        // load hvac status
        let hvacStatus = await storageHandler.getStoredApiData(carModel.getVin(), 'hvacStatus');
        if (hvacStatus && localApiHandler.setHVACStatus) {
            localApiHandler.setHVACStatus(hvacStatus);
        }



        // trigger a re-render
        if (!localApiHandler.hasError()) {
            setApiHandler(localApiHandler);
            setViewState(ViewState.LOADED);
        }

        // load from api
        const remoteApiHandler: ApiHandler = new RenaultApiHandler();
        remoteApiHandler.setApiData(data ?? { hasError: true });
        if (remoteApiHandler.setCockpitStatus)
            remoteApiHandler.setCockpitStatus(cockpitData ?? { hasError: true });
        if (remoteApiHandler.setLocationStatus)
            remoteApiHandler.setLocationStatus(locationStatus ?? { hasError: true });
        if (remoteApiHandler.setChargesHistory)
            remoteApiHandler.setChargesHistory({ hasError: chargesHistory === undefined, apiData: chargesHistory })

        data = await account.fetchCarStatus(carModel.getVin());
        if (!data.hasError) {
            // weird bug in first gen zoe
            if (data.apiData.chargingStatus == -1.1 && data.apiData.batteryLevel < 100) {
                data.apiData.chargingStatus = 1.0;
            }
            remoteApiHandler.setApiData(data);
            await storageHandler.storeApiData(data, carModel.getVin());
        } else {
            setErrorMessage(data.errorMessage ?? '');
            if (data.errorMessage == CarMakerClientErrors.PENDING_TFA) {
                // il faut refaire le TFA 
                if (!tfaInProgress.current) {
                    tfaInProgress.current = true;
                    navigation.navigate("TfaView", {
                        regToken: data.regToken ?? '',
                        origin: TfaOrigin.CAR_PAGE
                    });
                }

            } else {
                if (!localApiHandler.hasError()) {
                    // remote failed but data have been fetched one time
                    Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation(getErrorMessage(data.errorMessage ?? '')));
                } else {
                    // remote failed and no data have been fetched
                    setViewState(ViewState.ERROR);
                }
            }


            return;
        }

        cockpitData = await account.fetchCarCockpit(carModel.getVin());
        if (!cockpitData.hasError) {
            if (remoteApiHandler.setCockpitStatus)
                remoteApiHandler.setCockpitStatus(cockpitData);
            await storageHandler.storeApiData(cockpitData, carModel.getVin(), 'cockpitStatus');
        }
        // load remote location status
        locationStatus = await account.fetchLocationStatus(carModel.getVin());
        if (!locationStatus.hasError) {
            if (remoteApiHandler.setLocationStatus)
                remoteApiHandler.setLocationStatus(locationStatus);
            await storageHandler.storeApiData(locationStatus, carModel.getVin(), 'locationStatus');
        }
        // load remote charges history
        const fecthedChargesHistory = await account.fetchChargesHistory(carModel.getVin());
        if (!fecthedChargesHistory.hasError && remoteApiHandler.setChargesHistory) {
            const classChargeHistory = storageHandler.buildCharges(fecthedChargesHistory.apiData);
            const newCharges = await ChargesStorageController.saveNewCharges(carModel.getVin(), classChargeHistory);
            remoteApiHandler.setChargesHistory({
                hasError: false,
                apiData: newCharges,
            });
        }
        // load remote v2g sessions
        const localCarType = await storageHandler.getCarType(carModel.getVin());
        if (localCarType?.getSupportsV2G()) {
            const v2gSessions = await account.fetchV2GSessions(carModel.getVin());
            if (v2gSessions !== null && remoteApiHandler.setChargesHistory) {
                const convertedCharges = RenaultCharge.convertV2GSessionsToCharges(v2gSessions);
                const newCharges = await ChargesStorageController.saveNewCharges(carModel.getVin(), convertedCharges);
                remoteApiHandler.setChargesHistory({
                    hasError: false,
                    apiData: newCharges,
                });
            }
        }

        // load remote charges settings
        chargesSettings = await account.fetchChargesSettings(carModel.getVin());
        if (!chargesSettings.hasError) {
            if (remoteApiHandler.setChargingSettings) {
                remoteApiHandler.setChargingSettings(chargesSettings);
            }
            await storageHandler.storeApiData(chargesSettings, carModel.getVin(), 'chargesSettings');
        }

        // load remote hvac status
        hvacStatus = await account.fetchHVACStatus(carModel.getVin());
        if (!hvacStatus.hasError) {
            if (remoteApiHandler.setHVACStatus) {
                remoteApiHandler.setHVACStatus(hvacStatus);
            }
            await storageHandler.storeApiData(hvacStatus, carModel.getVin(), 'hvacStatus');
        }

        // trigger a re-render
        setApiHandler(remoteApiHandler);
        // in case the data has been fetched from locale
        if (!remoteApiHandler.hasError() && viewState == ViewState.LOADING) {
            setViewState(ViewState.LOADED);
        }
        // in case no data has been fetched
        if (remoteApiHandler.hasError() && viewState == ViewState.LOADING) {
            setViewState(ViewState.ERROR);
        }
    }

    const loadCarData = async () => {
        await loadCarModel();
        // refresh widget on ios
        refreshWidget();
        // load car data
        switch (carModel.getCarmaker()) {
            case CarMaker.DEMO: {
                loadDemoCar();
                break;
            }
            case CarMaker.HYUNDAI: {
                await loadHyundaiCar();
                break;
            }
            case CarMaker.ALPINE:
            case CarMaker.DACIA:
            case CarMaker.RENAULT: {
                await loadRenaultCar();
                break;
            }
        }
        setIsScrollViewLoading(false);
    }


    // if the view is loading for car data
    const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
    const [errorMessage, setErrorMessage] = useState<string>('');
    // if the scrollview is loading
    const [isScrollViewLoading, setIsScrollViewLoading] = useState<boolean>(false);
    const [image, setImage] = useState<string>('');
    const [apiHandler, setApiHandler] = useState<ApiHandler>(new RenaultApiHandler());

    const mockCarType = new CarType({
        brand: { name: '', display_name: '' },
        model: { name: '', display_name: '', engine_type: '' },
        battery: { size: 0, max_ac_power: 0, max_dc_power: -1 },
        chargingLimit: 0
    });
    const [carType, setCarType] = useState<CarType>(mockCarType);

    const carViewContextValues = useMemo(() => ({
        carModel,
        image,
        apiHandler,
        carType,
        loadCarModel,
        account
    }), [carModel, image, apiHandler, carType, account]);


    return (
        <CarViewContext.Provider value={carViewContextValues} >
            <SafeAreaView style={[styles.flex, {
                backgroundColor: getMainInterfaceBackground(isDarkMode)
            }]}>
                <ScrollView
                    style={[styles.mainScrollView]}
                    refreshControl={
                        <RefreshControl
                            refreshing={isScrollViewLoading}
                            onRefresh={() => {
                                setIsScrollViewLoading(true);
                                loadCarData();
                            }} />
                    }
                >
                    <View style={[commonStyles.spaceBetween, commonStyles.rowFlex, styles.paddingHorizontal, { flexWrap: "wrap" }]}>
                        <TouchableOpacity
                            onPress={() => {
                                setShouldDisplayCarChoice(true);
                                handleModalAnim(true);
                            }}
                            testID="carChoiceButton"
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ alignItems: 'flex-start' }}>
                                    <Text
                                        style={[commonStyles.navTitle]}
                                        testID="carViewTitle"
                                    >{carModel.getModel()}</Text>
                                    {(apiHandler.getLastUpdateDate().getFullYear() != new Date(0).getFullYear()) && (
                                        <Text testID="lastUpdateText" style={styles.lastUpdateText}>{languageHandler.getTranslation("lastUpdated")}{getDisplayDate(apiHandler.getLastUpdateDate())}</Text>
                                    )}
                                </View>
                                {/* Icon to quickly switch car */}
                                {currentUser.getCars().length > 1 && (
                                    <Icon
                                        testID={"carChoiceIcon" + carModel.getVin()}
                                        name="keyboard-arrow-down"
                                        size={25}
                                        color={getBlackColour(isDarkMode)}
                                        style={{ marginLeft: 10 }}
                                    />
                                )}
                                <BottomSheet
                                    testID="carChoiceModal"
                                    title={languageHandler.getTranslation("your_cars")}
                                    visible={shouldDisplayCarChoice}
                                    onClose={() => {
                                        setShouldDisplayCarChoice(false);
                                        handleModalAnim(false);
                                    }}
                                >
                                    <QuickSwitchView
                                        cars={currentUser.getCars()}
                                        onClose={() => {
                                            setShouldDisplayCarChoice(false);
                                            handleModalAnim(false);
                                        }}
                                        pagerRef={pagerRef}
                                    />
                                </BottomSheet>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            testID="openCoffeeModal"
                            onPress={() => {
                                navigation.navigate('DonationScreen');
                            }}
                        >
                            <MaterialIcon
                                name="coffee-outline"
                                size={25}
                                color={getBlackColour(isDarkMode)}></MaterialIcon>
                        </TouchableOpacity>


                    </View>
                    {(viewState == ViewState.LOADING) &&
                        <FullScreenLoading />
                    }
                    {(viewState == ViewState.ERROR) &&
                        <FullScreenError message={errorMessage} />
                    }
                    {viewState == ViewState.LOADED && (
                        <View style={{ display: 'flex', gap: 15, paddingBottom: 50 }}>
                            <SummaryCard navigation={navigation} />
                            <BatteryCard />
                            {apiHandler.shouldDisplayHVACCard() && (
                                <HVACCard />
                            )}
                            {apiHandler.shouldDisplayChargesCard() && (
                                <MainChargesCard navigation={navigation} />
                            )}
                            {apiHandler.shouldDisplayMap() && (
                                <MapCard navigation={navigation} />
                            )}
                        </View>

                    )}
                </ScrollView>

            </SafeAreaView>
        </CarViewContext.Provider>
    )
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    mainScrollView: {
        flex: 1,
    },
    paddingHorizontal: {
        paddingHorizontal: 15,
        marginVertical: 10,
    },
    lastUpdateText: {
        color: 'gray',
    },
    mainView: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 1,
        shadowRadius: 16.00,
        elevation: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: 10,
    },
    mainViewContent: {
        paddingHorizontal: 15,
    },


});

export default CarView;