import { useColorScheme, View, Image, Alert } from "react-native";
import Text from "../../../../../screen/Common/CustomText";
import Account, { CarMaker } from "../../../../../lib/clients/accounts/account";
import { getCarMakerLogo } from "../../../../kelec-model/lib/logos";
import { useContext } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import LoginDefaultView from "../../LoginDefaultView";
import KelecCard from "../../../../kelec-model/view/Card";
import { spacerM, spacerXXL } from "../../../../kelec-model/view/Spacers";
import { COMPATIBLE_OIDC_CAR_MAKERS } from "../../../oidc/oidc-conf";

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
    const { currentUser } = useContext(MainContext);

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
        <LoginDefaultView
            testID="carMakerSelectView"
            title="addCar"
            subtitle="theCarBrand"
            helpText="selectTheCarBrand"
            onNext={() => {
                if (selectedCarMaker) {
                    // for oidc
                    if (COMPATIBLE_OIDC_CAR_MAKERS.includes(selectedCarMaker)) {
                        navigation.navigate("OidcLoginView",
                            {
                                onError: (error: Error) => {
                                    navigation.goBack();
                                    Alert.alert(error.message);
                                },
                                onSuccess: (account: Account) => {
                                    navigation.navigate("SelectACarView", {
                                        account: account
                                    });
                                }
                            }
                        );
                        return;
                    } else {
                        // legacy login
                        navigation.navigate("CredentialsView", { selectedCarMaker: selectedCarMaker });
                        return;
                    }
                }
            }}
            shouldDisplayDismissButton={currentUser?.getCars().length > 0}
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
        </LoginDefaultView >
    );
};

export default CarMakerSelectView;