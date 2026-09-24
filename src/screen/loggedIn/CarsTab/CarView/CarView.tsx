import { StyleSheet, View, ScrollView, RefreshControl, Alert } from "react-native";
import { useCallback, useContext, useMemo } from "react";
import MainContext from "../../../../lib/Contexts/MainContext";
import CarModel from "../../../../lib/clients/cars/carModel";
import SummaryCard from "./Elements/SummaryCard";
import CarViewContext from "../../../../lib/Contexts/CarViewContext";
import Account from "../../../../lib/clients/accounts/account";
import FullScreenError, { getErrorMessage } from "../../../../FullScreenError";
import FullScreenLoading from "../../../../FullScreenLoading";
import ChargesSummaryCard from "../../../../packages/kelec-charge-history/views/ChargesSummaryCard";
import { useChargesHistory } from "../../../../packages/kelec-charge-history/controllers/ChargesHistoryProvider";
import { useHvac } from "../../../../packages/kelec-hvac/controllers/HvacProvider";
import { MapCard, useCarLocation } from "../../../../packages/kelec-map";
import HvacCard from "../../../../packages/kelec-hvac/views/HvacCard";
import BatteryCard from "./Elements/BatteryCard";
import PagerView from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../CarsPageView";
import { TFA_ROUTE } from "../../../../packages/kelec-tfa";
import { useFocusEffect, useTheme } from '@react-navigation/native';
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
    // au retour d'un autre écran (ex. modèle de la voiture modifié), on relit l'image et le modèle enregistrés
    useFocusEffect(useCallback(() => { reloadProfile(); }, [reloadProfile]));

    const onTfaRequired = useCallback(
        (regToken: string) => {
            if (tfaInProgress.current) return;
            tfaInProgress.current = true;
            navigation.navigate(TFA_ROUTE, { regToken, successMessageKey: 'pullToRefreshCarData' });
        },
        [navigation, tfaInProgress],
    );

    const onSoftError = useCallback(
        (message: string) => {
            setTimeout(() => {
                Alert.alert(
                    languageHandler.getTranslation('error'),
                    languageHandler.getTranslation(getErrorMessage(message)),
                );
            }, 300);
        },
        [languageHandler],
    );

    // Historique de charge, climatisation et position ne sont synchronisés qu'une fois la batterie récupérée.
    const { history: chargesHistory, sync: syncCharges } = useChargesHistory();
    const { sync: syncHvac } = useHvac();
    const { sync: syncLocation, isMapVisible } = useCarLocation();
    const onNetworkLoaded = useCallback(async () => {
        await Promise.all([syncCharges(), syncHvac(), syncLocation()]);
    }, [syncCharges, syncHvac, syncLocation]);

    const { status, errorMessage, apiHandler, revision, isRefreshing, refresh } = useCarData({
        carModel,
        account,
        onTfaRequired,
        onSoftError,
        onNetworkLoaded,
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
                            <HvacCard />
                            {chargesHistory.shouldDisplayChargesCard() && (
                                <ChargesSummaryCard navigation={navigation} />
                            )}
                            {isMapVisible && (
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