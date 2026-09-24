import { useContext, useEffect } from "react";
import { Alert, Keyboard } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MainContext from "../../../../../lib/Contexts/MainContext";
import CarModel from "../../../../../lib/clients/cars/carModel";
import FullScreenError from "../../../../../FullScreenError";
import FullScreenLoading from "../../../../../FullScreenLoading";
import StepLayout from "../../../../kelec-model/view/StepLayout";
import { CAR_TYPE_ROUTE } from "../../../../kelec-car-type";
import { useVehicleList } from "../../../controllers/useVehicleList";
import { LoginEntryParamList } from "../../LoginEntryView";
import CarSelector from "./CarSelector";

type Props = NativeStackScreenProps<LoginEntryParamList, 'SelectACarView'> & {
    selectedCar?: CarModel;
    setSelectedCar: (car: CarModel | undefined) => void;
}

/** Étape 3 : choix de la voiture parmi celles du compte. */
const SelectACarView = ({ navigation, route, selectedCar, setSelectedCar }: Props) => {
    const { languageHandler } = useContext(MainContext);
    const vehicles = useVehicleList(route.params.account);

    useEffect(() => {
        // on ferme le clavier s'il est resté ouvert après le TFA
        Keyboard.dismiss();
    }, []);

    return (
        <StepLayout
            title={languageHandler.getTranslation("addCar")}
            subtitle={languageHandler.getTranslation("chooseTheCar")}
            nextLabel={languageHandler.getTranslation("next")}
            testID="addViewSelector"
            onNext={() => {
                if (selectedCar === undefined) {
                    Alert.alert(languageHandler.getTranslation("selectACar"));
                    return;
                }
                navigation.navigate(CAR_TYPE_ROUTE, {
                    vin: selectedCar.getVin(),
                    imageUrl: selectedCar.getImageUrl(),
                    titleKey: "addCar",
                    subTitleKey: "carModel",
                });
            }}
            onPrevious={() => navigation.goBack()}
            nextButtonTestID="addSelectedCarButton"
        >
            {vehicles.status === 'error' && <FullScreenError message="impossibleToConnectToServer" />}
            {vehicles.status === 'loading' && <FullScreenLoading />}
            {vehicles.status === 'loaded' && (
                <CarSelector selectedCar={selectedCar} setSelectedCar={setSelectedCar} cars={vehicles.cars} />
            )}
        </StepLayout>
    );
};

export default SelectACarView;
