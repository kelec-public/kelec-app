import React, { useContext } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../../screen/Common/CustomText";
import commonStyles from "../../../lib/graphics/commonStyle";
import MainContext from "../../../lib/Contexts/MainContext";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAccentOrange } from "../../../lib/graphics/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserDisplayName } from "../services/userDisplayName";
import { ExternalLinks, openExternalLink } from "../services/externalLinks";

/** En-tête orange : nom de l'utilisateur (ou « Réglages ») et crédits. */
function SettingsHeader(): React.JSX.Element {
    const { languageHandler, currentUser } = useContext(MainContext);

    const getTitle = (): React.ReactNode => {
        const name = getUserDisplayName(currentUser);
        if (name) {
            return <Text testID="settingsTitle" style={[commonStyles.navTitle, { color: 'white' }]}>{name.firstName.toUpperCase()}{'\n'}{name.lastName.toUpperCase()}</Text>
        }

        return <Text testID="settingsTitle" style={[commonStyles.navTitle, { color: 'white' }]}>{languageHandler.getTranslation("settings").toUpperCase()}</Text>
    }

    return (
        <View style={{ backgroundColor: getAccentOrange(), paddingHorizontal: 15, paddingTop: 10, position: 'relative' }}>
            <SafeAreaView edges={['top']}>
                <Text style={[commonStyles.navTitle]}>{getTitle()}</Text>
                <View style={[commonStyles.rowFlex, commonStyles.centerFlex, commonStyles.gap5, styles.marginVertical, { flexWrap: "wrap" }]}>
                    <Text style={{ color: 'white' }}>{languageHandler.getTranslation('developedWith')} </Text>
                    <MaterialIcon name="heart" size={15} color="red"></MaterialIcon>
                    <Text style={{ color: 'white' }}>{languageHandler.getTranslation('by')}</Text>
                    <TouchableOpacity
                        testID='linkedinButton'
                        onPress={() => openExternalLink(ExternalLinks.AUTHOR_LINKEDIN)}>
                        <Text style={{ color: 'lightblue' }}>Kelyan Pegeot Selme</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            <View style={{ width: Dimensions.get('window').width, height: 100, backgroundColor: getAccentOrange(), position: 'absolute', bottom: 0, transform: [{ translateY: 100 }] }}></View>
        </View>
    )
};

const styles = StyleSheet.create({
    marginVertical: {
        marginVertical: 10
    }
});

export default SettingsHeader;