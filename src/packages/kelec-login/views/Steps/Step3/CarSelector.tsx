import { View, Image, useColorScheme, ActivityIndicator, StyleSheet } from "react-native";
import CarModel from "../../../../../lib/clients/cars/carModel";
import Text from "../../../../../screen/Common/CustomText";
import { capitlizeFirstLetter, formatPlate, getBlackColour } from "../../../../../lib/graphics/utils";
import { getCarMakerLogo } from "../../../../kelec-model/lib/logos";
import { useEffect, useState } from "react";
import fetchImage from "../../../../../lib/graphics/imageFetcher";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CommonStyles } from "../../../../kelec-model/view/Styles";
import { spacerL, spacerM, spacerS, spacerXL } from "../../../../kelec-model/view/Spacers";
import KelecCard from "../../../../kelec-model/view/Card";
import { subTitle2, subTitle3, title2 } from "../../../../kelec-model/view/Titles";
import { CarImageRepository } from "../../../../kelec-garage";

type Props = {
    selectedCar: CarModel | undefined;
    setSelectedCar: (car: CarModel) => void;
    cars: CarModel[];
}

const CarSelector = (props: Props) => {
    const { selectedCar, setSelectedCar, cars } = props;
    return (
        <View
            style={{
                gap: spacerM
            }}
        >
            {cars.map((car, _) => (
                <KelecCard
                    isSelected={selectedCar?.getVin() === car.getVin()}
                    key={car.getVin()}
                    onPress={() => setSelectedCar(car)}
                    testID="carRowCard"
                >
                    <CarRow
                        key={car.getVin()}
                        carModel={car}
                    />
                </KelecCard>
            ))}
        </View>
    )
};

type CarRowProps = {
    carModel: CarModel;

}

const CarRow = (props: CarRowProps) => {
    const isDarkMode = useColorScheme() === 'dark';
    const { carModel } = props;

    return (
        <View
            style={styles.carRowContainer}
        >
            <View
                style={{
                    width: 100,
                }}
            >
                <ImageRow imageUrl={carModel.getImageUrl()} carVin={carModel.getVin()} />
            </View>

            <View
                style={CommonStyles.container}
            >
                {/* car maker logo */}
                <View
                    style={styles.carMakerLogoContainer}
                >
                    <Image
                        source={getCarMakerLogo(carModel.getCarmaker(), isDarkMode)}
                        style={styles.carMakerLogo} />
                    <Text>{capitlizeFirstLetter(carModel.getCarmaker())}</Text>
                </View>
                {/* car model name */}
                <Text
                    style={title2}>
                    {carModel.getModel()}
                </Text>
                {/* car license plate */}
                {carModel.getRegistrationNumber() && (
                    <Text
                        testID={'registrationText'}
                        style={subTitle3}
                    >{formatPlate(carModel.getRegistrationNumber())}</Text>
                )}
                {/* car vin */}
                <Text
                    testID={'vinText'}
                    style={subTitle2}
                >{carModel.getVin()}</Text>
            </View>
        </View>
    )
};

type ImageProps = {
    imageUrl: string;
    carVin: string;
}

enum ViewState {
    LOADING,
    LOADED,
    ERROR
}
const ImageRow = (props: ImageProps) => {
    const isDarkMode = useColorScheme() === 'dark';
    const { imageUrl, carVin } = props;

    const [imageData, setImageData] = useState<string | null>(null);
    const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

    useEffect(() => {
        loadImage();
    }, [carVin]);

    const loadImage = async () => {
        const imageData = await fetchImage(imageUrl);
        if (imageData == null) {
            setViewState(ViewState.ERROR);
            return;
        }
        await CarImageRepository.save(carVin, imageData ?? '');
        setImageData(imageData);
        setViewState(ViewState.LOADED);
    };

    switch (viewState) {
        case ViewState.LOADING: {
            return (
                <ActivityIndicator size='large' />
            );
        }
        case ViewState.ERROR: {
            return (
                <Icon name="error" size={30} color={getBlackColour(isDarkMode)} />
            );
        }
        case ViewState.LOADED: {
            return (
                <Image
                    testID={'addImageRow'}
                    source={{ uri: `data:image/jpeg;base64,${imageData}` }}
                    style={styles.carImage}
                />
            );
        }
    }

};


const styles = StyleSheet.create({
    carRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerL
    },
    carMakerLogoContainer:
    {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerS,
    },
    carMakerLogo: {
        width: spacerXL,
        height: spacerXL,
        resizeMode: 'contain'
    },
    carImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 10,
        resizeMode: 'contain'
    }
});

export default CarSelector;