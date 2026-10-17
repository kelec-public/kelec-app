import { useContext } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayBackgroundColour, getWhiteColour } from "../../../lib/graphics/utils";
import GlassButton from "../../kelec-model/view/GlassButton";

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

    const fallbackStyle = [styles.button, { backgroundColor: getGrayBackgroundColour(isDarkMode) }];
    const iconStyle = { transform: [{ translateY: 1 }] };

    return (
        <View style={[commonStyles.paddingHorizontal, styles.header]}>
            <Text style={[commonStyles.navTitle]}>{languageHandler.getTranslation("account")}</Text>
            {hasMultipleCars ? (
                <View style={[commonStyles.rowFlex, commonStyles.gap10]}>
                    <GlassButton
                        testID='profileViewEditCarsButton'
                        icon="edit"
                        iconTestID="profileViewEditIcon"
                        iconSize={20}
                        iconStyle={iconStyle}
                        onPress={onToggleEditMode}
                        selected={editMode}
                        glassStyle={styles.glassButton}
                        fallbackStyle={[styles.button, { backgroundColor: editMode ? getBlackColour(isDarkMode) : getGrayBackgroundColour(isDarkMode) }]}
                        fallbackIconColour={editMode ? getWhiteColour(isDarkMode) : getBlackColour(isDarkMode)}
                    />
                    <GlassButton
                        testID='profileViewAddCarButton'
                        icon="add"
                        iconSize={20}
                        iconStyle={iconStyle}
                        onPress={onAddCar}
                        glassStyle={styles.glassButton}
                        fallbackStyle={fallbackStyle}
                    />
                </View>
            ) : (
                <GlassButton
                    testID='profileViewAddCarButton'
                    icon="add"
                    text={languageHandler.getTranslation("addACar")}
                    iconSize={20}
                    iconStyle={iconStyle}
                    onPress={onAddCar}
                    glassStyle={styles.glassButton}
                    fallbackStyle={fallbackStyle}
                />
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
    glassButton: {
        height: 40,
        minWidth: 40,
        borderRadius: 99,
        paddingHorizontal: 10,
    },
});

export default ProfileHeader;
