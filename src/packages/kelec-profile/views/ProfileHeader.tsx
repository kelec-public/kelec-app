import { useContext } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayBackgroundColour, getWhiteColour } from "../../../lib/graphics/utils";

type Props = {
    readonly hasMultipleCars: boolean;
    readonly editMode: boolean;
    readonly onToggleEditMode: () => void;
    readonly onAddCar: () => void;
}

/**
 * Titre + boutons. Avec plusieurs voitures : boutons compacts (édition, ajout) ;
 * sinon, un seul bouton « Ajouter une voiture ».
 */
function ProfileHeader({ hasMultipleCars, editMode, onToggleEditMode, onAddCar }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);

    const buttonStyle = [styles.button, commonStyles.rowFlex, commonStyles.centerFlex];
    const iconStyle = { transform: [{ translateY: 1 }] };

    return (
        <View style={[commonStyles.paddingHorizontal, styles.header]}>
            <Text style={[commonStyles.navTitle]}>{languageHandler.getTranslation("account")}</Text>
            {hasMultipleCars ? (
                <View style={[commonStyles.rowFlex, commonStyles.gap10]}>
                    <TouchableOpacity testID='profileViewEditCarsButton' onPress={onToggleEditMode}>
                        <View style={[buttonStyle, { backgroundColor: editMode ? getBlackColour(isDarkMode) : getGrayBackgroundColour(isDarkMode) }]}>
                            <Icon name="edit" testID="profileViewEditIcon" size={20} style={iconStyle} color={editMode ? getWhiteColour(isDarkMode) : getBlackColour(isDarkMode)} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity testID='profileViewAddCarButton' onPress={onAddCar}>
                        <View style={[buttonStyle, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                            <Icon name="add" size={20} style={iconStyle} color={getBlackColour(isDarkMode)} />
                        </View>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity testID='profileViewAddCarButton' onPress={onAddCar}>
                    <View style={[buttonStyle, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                        <Text>{languageHandler.getTranslation("addACar")}</Text>
                        <Icon name="add" size={20} style={iconStyle} color={getBlackColour(isDarkMode)} />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    button: {
        height: 40,
        borderRadius: 99,
        paddingHorizontal: 10,
    },
});

export default ProfileHeader;
