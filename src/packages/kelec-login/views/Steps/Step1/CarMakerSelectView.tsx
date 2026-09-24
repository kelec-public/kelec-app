import { useColorScheme, View, Image } from "react-native";
import Text from "../../../../../screen/Common/CustomText";
import { CarMaker } from "../../../../../lib/clients/accounts/account";
import { getCarMakerLogo } from "../../../../kelec-model/lib/logos";
import { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import StepLayout from "../../../../kelec-model/view/StepLayout";
import { ViewsAvailable } from "../../../../../Main";
import KelecCard from "../../../../kelec-model/view/Card";
import { spacerM, spacerXXL } from "../../../../kelec-model/view/Spacers";

type Props = {
    selectedCarMaker?: CarMaker;
    setSelectedCarMaker: (carMaker?: CarMaker) => void;
    navigation?: any;
}

type CarMakerElem = {
    brand: CarMaker;
    display: string;
};

const carMakerList: CarMakerElem[] = [
    {
        "brand": CarMaker.ALPINE,
        "display": "Alpine"
    },
    {
        "brand": CarMaker.DACIA,
        "display": "Dacia"
    },
    {
        "brand": CarMaker.HYUNDAI,
        "display": "Hyundai"
    },
    {
        "brand": CarMaker.RENAULT,
        "display": "Renault"
    }

];

const CarMakerSelectView = (props: Props) => {
    const { selectedCarMaker, setSelectedCarMaker, navigation } = props;
    const { currentUser, languageHandler, setCurrentView } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    const isDarkMode = useColorScheme() === 'dark';

    const carMakerRow = (carMakerElem: CarMakerElem, isSelected: boolean) => {
        return <KelecCard
            isSelected={isSelected}
            onPress={() => {
                setSelectedCarMaker(carMakerElem.brand);
            }}
            key={carMakerElem.brand}
            testID={carMakerElem.brand + "Logo"}
        >
            <Image
                style={{
                    width: spacerXXL,
                    height: spacerXXL,
                    resizeMode: 'contain',
                }}
                source={
                    getCarMakerLogo(carMakerElem.brand, isDarkMode)
                }
            />
            <Text>{carMakerElem.display}</Text>
        </KelecCard>
    }

    return (
        <StepLayout
            testID="carMakerSelectView"
            title={t("addCar")}
            subtitle={t("theCarBrand")}
            helpText={t("selectTheCarBrand")}
            nextLabel={t("next")}
            onNext={() => {
                if (selectedCarMaker) {
                    navigation.navigate("CredentialsView", { selectedCarMaker: selectedCarMaker });
                }
            }}
            // fermeture seulement s'il y a déjà une voiture à afficher
            onDismiss={currentUser?.getCars().length > 0 ? () => setCurrentView(ViewsAvailable.LOGGEDIN) : undefined}
        >
            <View
                style={{
                    gap: spacerM
                }}
            >
                {
                    carMakerList.map((carMakerElem) => {
                        const isSelected = selectedCarMaker === carMakerElem.brand;
                        return (
                            carMakerRow(carMakerElem, isSelected)
                        )
                    })
                }
            </View>
        </StepLayout>
    );
};

export default CarMakerSelectView;