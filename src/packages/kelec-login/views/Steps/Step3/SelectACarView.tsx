import { useContext, useEffect } from "react";
import { Alert, Keyboard } from "react-native";
import Text from "../../../../../screen/Common/CustomText";
import { textBody } from "../../../../kelec-model/view/Titles";
import { GarageService } from "../../../../kelec-garage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MainContext from "../../../../../lib/Contexts/MainContext";
import FullScreenError from "../../../../../FullScreenError";
import FullScreenLoading from "../../../../../FullScreenLoading";
import StepLayout from "../../../../kelec-model/view/StepLayout";
import { CAR_TYPE_ROUTE } from "../../../../kelec-car-type";
import { useVehicleList } from "../../../controllers/useVehicleList";
import { ListedVehicle } from "../../../models/listedVehicle";
import { LoginEntryParamList } from "../../LoginEntryView";
import CarSelector from "./CarSelector";

type Props = NativeStackScreenProps<LoginEntryParamList, 'SelectACarView'> & {
    selectedVehicle?: ListedVehicle;
    setSelectedVehicle: (vehicle: ListedVehicle | undefined) => void;
}

/** Étape 3 : choix de la voiture parmi celles du compte. */
const SelectACarView = ({ navigation, route, selectedVehicle, setSelectedVehicle }: Props) => {
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
                const selectedCar = selectedVehicle?.car;
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
            {vehicles.status === 'loaded' && vehicles.vehicles.length > 0 && (
                <CarSelector selectedVehicle={selectedVehicle} setSelectedVehicle={setSelectedVehicle} vehicles={vehicles.vehicles} />
            )}
            {vehicles.status === 'loaded' && vehicles.vehicles.length === 0 && (
                <Text testID="noCarToAdd" style={textBody}>
                    {languageHandler.getTranslation("noVehicleToAdd")}
                </Text>
            )}
        </StepLayout>
    );
};

export default SelectACarView;
