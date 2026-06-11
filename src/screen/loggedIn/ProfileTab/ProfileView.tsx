import React, { useContext, useState } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native';
import { getBlackColour, getGrayBackgroundColour,  getWhiteColour } from '../../../lib/graphics/utils';
import Text from '../../Common/CustomText';
import MainContext from '../../../lib/Contexts/MainContext';
import commonStyles from '../../../lib/graphics/commonStyle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CarRow from './CarRow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewsAvailable } from '../../../Main';
import { useTheme } from '@react-navigation/native';


function ProfileView(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();

    const { languageHandler, currentUser, setCurrentView } = useContext(MainContext);

    // edit mode means user can move cars up and down
    const [editMode, setEditMode] = useState(false);

    return (
        <View
            testID='profileView'
            style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}
        >
            <SafeAreaView style={[commonStyles.flex]} edges={['top']}>
                <View style={[commonStyles.paddingHorizontal, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <Text style={[commonStyles.navTitle]}>{languageHandler.getTranslation("account")}</Text>
                    {/* display compact buttons if there are multiple cars added */}
                    {currentUser.getCars().length > 1 && (
                        <View style={[commonStyles.rowFlex, commonStyles.gap10]}>
                            <TouchableOpacity
                                testID='profileViewEditCarsButton'
                                onPress={() => {
                                    // set edit mode
                                    setEditMode(!editMode);

                                }}
                            >
                                <View style={[styles.addACarWrapper, commonStyles.rowFlex, commonStyles.centerFlex, { backgroundColor: editMode ? getBlackColour(isDarkMode) : getGrayBackgroundColour(isDarkMode) }]}>
                                    <Icon name="edit" testID="profileViewEditIcon" size={20} style={{ transform: [{ translateY: 1 }] }} color={editMode ? getWhiteColour(isDarkMode) : getBlackColour(isDarkMode)} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID='profileViewAddCarButton'
                                onPress={() => {
                                    // open add a car modal
                                    setCurrentView(ViewsAvailable.LOGIN);
                                }}
                            >
                                <View style={[styles.addACarWrapper, commonStyles.rowFlex, commonStyles.centerFlex, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                                    <Icon name="add" size={20} style={{ transform: [{ translateY: 1 }] }} color={getBlackColour(isDarkMode)} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )
                    }
                    {/* else display only one button*/}
                    {
                        currentUser.getCars().length <= 1 && (
                            <TouchableOpacity
                                testID='profileViewAddCarButton'
                                onPress={() => {
                                    // open add a car modal
                                    setCurrentView(ViewsAvailable.LOGIN);
                                }}
                            >
                                <View style={[styles.addACarWrapper, commonStyles.rowFlex, commonStyles.centerFlex, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                                    <Text>{languageHandler.getTranslation("addACar")}</Text>
                                    <Icon name="add" size={20} style={{ transform: [{ translateY: 1 }] }} color={getBlackColour(isDarkMode)} />
                                </View>
                            </TouchableOpacity>
                        )
                    }

                </View >
                <View style={commonStyles.navSeparator}></View>
                <View style={[commonStyles.flex, styles.mainWrapper, { backgroundColor: theme.colors.background }]}>
                    {/* car list */}
                    <ScrollView
                        style={commonStyles.flex}
                    >
                        {currentUser.getCars().map((account, index) => {
                            return (
                                <View key={account.car?.getVin()}>
                                    <CarRow key={account.car!.getVin()} carModel={account.car} email={account.getEmail()} index={index} editMode={editMode} />

                                </View>

                            );
                        })}
                    </ScrollView>
                    {/* display the default selected car */}
                    {currentUser.getSelectedCar() !== '' && (
                        <Text style={[commonStyles.smallText, styles.bottomText]}>
                            <View style={{ transform: [{ translateY: 1 }] }}><Icon name="info" size={15} color={getBlackColour(isDarkMode)} /></View>
                            {currentUser.getSelectedCarName()}{' '}{languageHandler.getTranslation('isSelectedAsDefault')}</Text>
                    )}
                </View>
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainWrapper: {
        paddingTop: 15,
        flex: 1,
        paddingHorizontal: 15,
        gap: 10
    },
    profilePicWrapper: {
    },
    addACarWrapper: {
        height: 40,
        borderRadius: 99,
        paddingHorizontal: 10,
    },
    bottomText: {
        marginBottom: 10
    }
});

export default ProfileView;