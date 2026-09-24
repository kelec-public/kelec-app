import { useContext, useState } from "react";
import { StyleSheet, View, Image, TouchableOpacity, useColorScheme, Animated } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Text from "../../../screen/Common/CustomText";
import commonStyles from "../../../lib/graphics/commonStyle";
import { formatPlate, getBlackColour, getCarMakerLogo, getGrayBackgroundColour } from "../../../lib/graphics/utils";
import MainContext from "../../../lib/Contexts/MainContext";
import { MoveDirection } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { toImageUri, useCarImage } from "../../kelec-garage";
import { useShakeAnimation } from "../controllers/useShakeAnimation";
import RenameCarDialog from "./RenameCarDialog";
import CarRowAction, { ActionSlot } from "./CarRowAction";

type Props = {
    readonly carModel: CarModel;
    readonly index: number; // position parmi les voitures de l'utilisateur
    readonly isLast: boolean;
    readonly editMode: boolean; // mode édition : monter / descendre les voitures
    readonly isDefault: boolean;
    readonly onSelectDefault: () => void;
    readonly onMove: (direction: MoveDirection) => void;
    readonly onRename: (name: string) => void;
    readonly onDelete: () => void;
}

function CarRow({ carModel, index, isLast, editMode, isDefault, onSelectDefault, onMove, onRename, onDelete }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);

    const image = useCarImage(carModel.getVin());
    const shakeOffset = useShakeAnimation(editMode, 200 * index);
    const [isRenaming, setIsRenaming] = useState(false);

    const iconColour = getBlackColour(isDarkMode);
    const registration = carModel.getRegistrationNumber();

    return (
        <Animated.View style={[styles.card, { backgroundColor: getGrayBackgroundColour(isDarkMode), transform: [{ translateX: shakeOffset }] }]}>
            <RenameCarDialog
                visible={isRenaming}
                currentName={carModel.getModel()}
                onCancel={() => setIsRenaming(false)}
                onConfirm={name => {
                    setIsRenaming(false);
                    onRename(name);
                }}
            />
            <View style={styles.header}>
                <View style={[commonStyles.rowFlex, { gap: 10, alignItems: 'center' }]}>
                    <Image style={styles.logo} source={getCarMakerLogo(carModel.getCarmaker(), isDarkMode)} />
                    <View style={{ gap: 5 }}>
                        <Text testID="profileCarRowModel" style={{ flexShrink: 1, flexWrap: 'wrap' }}>{carModel.getModel()}</Text>
                        <Text testID="vinOrRegistrationCarRow" style={commonStyles.verySmallText}>
                            {registration == undefined ? carModel.getVin() : formatPlate(registration)}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity testID="selectAsDefaultCar" onPress={onSelectDefault}>
                    <View
                        testID="selectAsDefaultCarIcon"
                        style={[commonStyles.centerFlex, styles.rounded, {
                            backgroundColor: isDefault ? iconColour : getGrayBackgroundColour(isDarkMode),
                            borderColor: iconColour
                        }]}>
                        <Icon name="check" color={getGrayBackgroundColour(isDarkMode)} size={20} />
                    </View>
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                    <Image style={styles.carImage} source={{ uri: toImageUri(image) }} />
                </View>

                <View style={{ flex: 1, justifyContent: 'space-around' }}>
                    <View style={styles.actions}>
                        {editMode ? (
                            <>
                                <ActionSlot>
                                    {index !== 0 && (
                                        <CarRowAction
                                            testID="moveTheCarUp"
                                            icon={<Icon name="expand-less" color={iconColour} size={20} style={styles.actionIcon} />}
                                            label={languageHandler.getTranslation("toTheTop")}
                                            onPress={() => onMove(MoveDirection.UP)}
                                        />
                                    )}
                                </ActionSlot>
                                <ActionSlot>
                                    {!isLast && (
                                        <CarRowAction
                                            testID="moveTheCarDown"
                                            icon={<Icon name="expand-more" color={iconColour} size={20} style={styles.actionIcon} />}
                                            label={languageHandler.getTranslation("toTheBottom")}
                                            onPress={() => onMove(MoveDirection.DOWN)}
                                        />
                                    )}
                                </ActionSlot>
                            </>
                        ) : (
                            <>
                                <ActionSlot>
                                    <CarRowAction
                                        testID="renameCarOpenButton"
                                        icon={<MaterialIcon name="pen" color={iconColour} size={20} style={styles.actionIcon} />}
                                        label={languageHandler.getTranslation("renameCar")}
                                        onPress={() => setIsRenaming(true)}
                                        fitLabel
                                    />
                                </ActionSlot>
                                <ActionSlot>
                                    <CarRowAction
                                        testID="deleteTheCar"
                                        icon={<MaterialIcon name="delete-empty" color={iconColour} size={20} style={styles.actionIcon} />}
                                        label={languageHandler.getTranslation("deleteVehicle")}
                                        onPress={onDelete}
                                        fitLabel
                                    />
                                </ActionSlot>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 15,
        borderRadius: 7,
        marginBottom: 15,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flex: 1,
        gap: 10,
        marginVertical: 5,
    },
    actionIcon: {
        paddingBottom: 10,
    },
    carImage: {
        height: 100,
        width: '100%',
        transform: [{ scale: 1.15 }],
        resizeMode: 'contain'
    },
    rounded: {
        borderRadius: 100,
        borderWidth: 1,
    },
    logo: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
});

export default CarRow;
