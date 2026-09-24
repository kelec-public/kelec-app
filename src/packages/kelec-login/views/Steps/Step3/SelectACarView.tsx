import { useContext, useEffect } from "react";
import { Alert, Keyboard } from "react-native";
import Text from "../../../../../screen/Common/CustomText";
import { textBody } from "../../../../kelec-model/view/Titles";
import { GarageService } from "../../../../kelec-garage";
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
    const { languageHandler, currentUser } = useContext(MainContext);
    const garage = new GarageService(currentUser);
    const vehicles = useVehicleList(route.params.account, vin => garage.hasCar(vin));

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
            {vehicles.status === 'loaded' && vehicles.cars.length > 0 && (
                <CarSelector selectedCar={selectedCar} setSelectedCar={setSelectedCar} cars={vehicles.cars} />
            )}
            {vehicles.status === 'loaded' && vehicles.cars.length === 0 && (
                <Text testID="noCarToAdd" style={textBody}>
                    {languageHandler.getTranslation("noVehicleToAdd")}
                </Text>
            )}
        </StepLayout>
    );
};

export default SelectACarView;
