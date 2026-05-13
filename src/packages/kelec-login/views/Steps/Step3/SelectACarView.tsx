import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginEntryParamList } from "../../LoginEntryView";
import { CarMaker } from "../../../../../lib/clients/accounts/account";
import { useContext, useEffect, useState } from "react";
import CarModel from "../../../../../lib/clients/cars/carModel";
import { Alert } from "react-native";
import MainContext from "../../../../../lib/Contexts/MainContext";
import FullScreenError from "../../../../../FullScreenError";
import FullScreenLoading from "../../../../../FullScreenLoading";
import CarSelector from "./CarSelector";
import RenaultAccount from "../../../../../lib/clients/accounts/renaultAccount";
import RenaultClient from "../../../../../lib/clients/carMakers/renaultClient";
import RenaultCar from "../../../../../lib/clients/cars/renaultCar";
import HyundaiAccount from "../../../../../lib/clients/accounts/hyundaiAccount";
import HyundaiClient from "../../../../../lib/clients/carMakers/hyundaiClient";
import HyundaiCar from "../../../../../lib/clients/cars/hyundaiCar";
import LoginDefaultView from "../../LoginDefaultView";

type Props = NativeStackScreenProps<LoginEntryParamList, 'SelectACarView'> & {
    selectedCar?: CarModel;
    setSelectedCar: (car: CarModel | undefined) => void;
    onConfirmCarAdd?: () => Promise<void>;
}

enum ViewState {
    LOADING,
    ERROR,
    LOADED
}
const SelectACarView = (props: Props) => {
    const { languageHandler } = useContext(MainContext);
    const { navigation, route, selectedCar, setSelectedCar, onConfirmCarAdd } = props;
    const { account } = route.params;

    // store fetched cars
    const [cars, setCars] = useState<CarModel[]>([]);
    const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);


    // get cars
    useEffect(() => {
        if (account.getEmail() != "") {
            loadCars();
        }
    }, [account]);

    const loadCars = async () => {
        const carMaker = account?.getCarMaker();
        switch (carMaker) {
            case CarMaker.RENAULT:
            case CarMaker.DACIA:
            case CarMaker.ALPINE: {
                await loadRenaultGroupCars();
                break;
            }
            case CarMaker.HYUNDAI: {
                await loadHyundaiCars();
                break;
            }
            case CarMaker.DEMO: {
                await loadDemoCar();
                break;
            }
        };
    };

    /* the following sections need a refactoring */
    const loadRenaultGroupCars = async () => {
        try {
            const carMaker = account?.getCarMaker();
            const userRenault = account as RenaultAccount;
            const client = new RenaultClient(userRenault.getEmail(), userRenault.getPassword(), userRenault.getKamereonAccountID());
            const vehicles = await client.getVehicles();
            if (vehicles.hasError) {
                setViewState(ViewState.ERROR);
                return;
            }

            const vehiclesModels = [];
            for (const vehicle of vehicles.vehicles) {
                const name = vehicle.vehicleDetails.model.label;
                const vin = vehicle.vin;
                const registrationNumber = vehicle.vehicleDetails.registrationNumber;
                let imageUrl = 'https://api.kelec.app/placeholder'; // default image if car doesn't have one
                for (let asset of vehicle.vehicleDetails.assets ?? []) {
                    if (asset.assetType === "PICTURE" && asset.viewpoint === "mybrand_2") {
                        imageUrl = asset.renditions[0].url;
                    }
                }

                const carModel = new RenaultCar(vin, name, imageUrl, carMaker, registrationNumber);
                vehiclesModels.push(carModel);
            }
            setCars(vehiclesModels);
            setViewState(ViewState.LOADED);
        } catch (error) {
            console.error("Error loading Renault Group cars: ", error);
            setViewState(ViewState.ERROR);
        }
    }

    const loadHyundaiCars = async () => {
        const userHyundai = account as HyundaiAccount;
        const client = new HyundaiClient(userHyundai.getEmail(), userHyundai.getPassword(), userHyundai.getPinCode());
        const vehicles = await client.getVehicles();
        if (vehicles.hasError === true) {
            setViewState(ViewState.ERROR);
            return;
        }
        const vehiclsModels = [];
        for (let vehicle of vehicles.vehicles) {
            const name = vehicle.name;
            const vin = vehicle.vin;
            const imageUrl = vehicle.imageUrl;
            const registrationNumber = vehicle.registrationNumber;
            const carModel = new HyundaiCar(vin, name, imageUrl, CarMaker.HYUNDAI, registrationNumber);
            vehiclsModels.push(carModel);
        }
        setCars(vehiclsModels);
        setViewState(ViewState.LOADED);
    };

    const loadDemoCar = async () => {
        const vehiclsModels = [];
        const carModel = new CarModel('VF1AA', 'Demo car', 'https://api.kelec.app/placeholder', CarMaker.DEMO, 'AA001AA');
        const carModel2 = new CarModel('VF1AA2', 'Demo car2', 'https://api.kelec.app/placeholder', CarMaker.DEMO, 'BB001BB');
        vehiclsModels.push(carModel);
        vehiclsModels.push(carModel2);
        setCars(vehiclsModels);
        setViewState(ViewState.LOADED);
    };

    return (
        <LoginDefaultView
            title="addCar"
            subtitle="chooseTheCar"
            testID="addViewSelector"
            onNext={() => {
                if (selectedCar === undefined) {
                    Alert.alert(languageHandler.getTranslation("selectACar"));
                    return;
                }
                navigation.navigate("CarModelSelector", {
                    carModel: selectedCar,
                    onConfirmUpdate: onConfirmCarAdd!,
                    title: "addCar",
                    subTitle: "carModel"
                });
            }}
            onPrevious={() => {
                navigation.goBack();
            }}
            nextButtonTestID="addSelectedCarButton"

        >
            {viewState === ViewState.ERROR && (
                <FullScreenError message="impossibleToConnectToServer" />
            )}
            {viewState === ViewState.LOADING && (
                <FullScreenLoading />
            )}
            {viewState === ViewState.LOADED && (
                <CarSelector selectedCar={selectedCar} setSelectedCar={setSelectedCar} cars={cars} />
            )}
        </LoginDefaultView >
    );

};

export default SelectACarView;