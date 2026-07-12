import { StyleSheet, View, ScrollView, RefreshControl, Alert } from "react-native";
import { useCallback, useContext, useMemo } from "react";
import MainContext from "../../../../lib/Contexts/MainContext";
import CarModel from "../../../../lib/clients/cars/carModel";
import SummaryCard from "./Elements/SummaryCard";
import CarViewContext from "../../../../lib/Contexts/CarViewContext";
import Account from "../../../../lib/clients/accounts/account";
import FullScreenError, { getErrorMessage } from "../../../../FullScreenError";
import FullScreenLoading from "../../../../FullScreenLoading";
import MapCard from "./Elements/MapCard";
import HVACCard from "./Elements/HVACCard";
import MainChargesCard from "./ChargesView.tsx/MainChargesCard";
import BatteryCard from "./Elements/BatteryCard";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../CarsPageView";
import { TfaOrigin } from "../../../../packages/kelec-login/views/Steps/Step2/Tfa/TfaView";
import { useTheme } from '@react-navigation/native';
import { useCarProfile } from "../../../../packages/kelec-car-page/services/useCarProfile";
import { useCarData } from "../../../../packages/kelec-car-page/services/useCarData";
import CarViewHeader from "../../../../packages/kelec-car-page/views/CarViewHeader";


type CarViewProps = NativeStackScreenProps<CarsViewParamList, "CarView"> & {
    carModel: CarModel;
    account: Account;
    pagerRef: React.RefObject<PagerView | null>;
    tfaInProgress: React.RefObject<boolean>;
}

function CarView({ carModel, navigation, account, pagerRef, tfaInProgress }: CarViewProps): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);

    const { image, carType, reload: reloadProfile } = useCarProfile(carModel);

    const onTfaRequired = useCallback(
        (regToken: string) => {
            if (tfaInProgress.current) return;
            tfaInProgress.current = true;
            navigation.navigate('TfaView', { regToken, origin: TfaOrigin.CAR_PAGE });
        },
        [navigation, tfaInProgress],
    );

    const onSoftError = useCallback(
        (message: string) => {
            Alert.alert(
                languageHandler.getTranslation('error'),
                languageHandler.getTranslation(getErrorMessage(message)),
            );
        },
        [languageHandler],
    );

    const { status, errorMessage, apiHandler, revision, isRefreshing, refresh } = useCarData({
        carModel,
        account,
        onTfaRequired,
        onSoftError,
    });

    const carViewContextValues = useMemo(
        () => ({ carModel, image, apiHandler, carType, loadCarModel: reloadProfile, account }),
        [carModel, image, apiHandler, revision, carType, reloadProfile, account],
    );


    return (
        <CarViewContext.Provider value={carViewContextValues} >
            <SafeAreaView style={[styles.flex, {
                backgroundColor: useTheme().colors.background
            }]}
                edges={['top']}>
                <ScrollView
                    style={[styles.mainScrollView]}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refresh}
                        />
                    }
                >

                    <CarViewHeader
                        carModel={carModel}
                        lastUpdateDate={apiHandler.getLastUpdateDate()}
                        pagerRef={pagerRef}
                        onOpenDonation={() => navigation.navigate('DonationScreen')}
                    />

                    {(status == 'loading') &&
                        <FullScreenLoading />
                    }
                    {(status == 'error') &&
                        <FullScreenError message={errorMessage} />
                    }
                    {status == 'loaded' && (
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
}

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