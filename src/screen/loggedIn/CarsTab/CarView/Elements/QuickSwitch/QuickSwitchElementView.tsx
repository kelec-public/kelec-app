import { Image, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Account, { CAR_MAKER_DISPLAY, CarMaker } from "../../../../../../lib/clients/accounts/account";
import Text from "../../../../../Common/CustomText";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlackColour } from "../../../../../../lib/graphics/utils";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


type Props = {
    car: Account;
    onSelect: () => void;
    isLast: boolean;
}

const QuickSwitchElementView = (props: Props) => {
    const { car, onSelect, isLast } = props;
    const VIN = car.getCar()?.getVin();
    const isDarkMode = useColorScheme() === 'dark';
    const carMaker = CAR_MAKER_DISPLAY[car.car?.getCarmaker() as CarMaker];
    const model = car.car?.getModel();
    const [imageUri, setImageUri] = useState<string>('');

    useEffect(() => {
        loadImageData();
    });

    const loadImageData = async () => {
        const image = await AsyncStorage.getItem(`${car.car?.getVin()}/image`);
        if (image) {
            setImageUri(`data:image/jpeg;base64,${image}`);
        }
    };

    return (
        <TouchableOpacity
            onPress={onSelect}
            testID={`carChoice${VIN}`}
            activeOpacity={0.7}
        >
            <View style={[commonStyles.rowFlex, commonStyles.centerFlex]}>

                <Image
                    style={styles.carImage}
                    source={{ uri: imageUri }}
                    resizeMode="contain"
                />

                <View style={styles.info}>
                    <Text style={styles.carMaker}>{carMaker}</Text>
                    <Text style={styles.carModel}>{model}</Text>
                </View>

                <Icon
                    name="keyboard-arrow-right"
                    size={24}
                    color={getBlackColour(isDarkMode)}
                />

            </View>

            {!isLast && (
                <View style={[commonStyles.navSeparator]} />
            )}
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    carImage: {
        width: 100,
        height: 80,
        resizeMode: 'contain',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    carMaker: {
        fontSize: 13,
        opacity: 0.6,
    },
    carModel: {
        fontSize: 16,
    },
});

export default QuickSwitchElementView;