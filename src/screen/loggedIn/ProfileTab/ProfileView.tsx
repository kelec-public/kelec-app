import React, { useContext, useState } from 'react';
import { View, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { getBlackColour, getGrayBackgroundColour, getMainInterfaceBackground, getWhiteColour } from '../../../lib/graphics/utils';
import Text from '../../Common/CustomText';
import MainContext from '../../../lib/Contexts/MainContext';
import commonStyles from '../../../lib/graphics/commonStyle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CarRow from './CarRow';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import { ViewsAvailable } from '../../../Main';


function ProfileView(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'android' ? 20 : tabBarHeight - insets.bottom + 20;

    const { languageHandler, currentUser, setCurrentView } = useContext(MainContext);

    // edit mode means user can move cars up and down
    const [editMode, setEditMode] = useState(false);

    return (
        <View
            testID='profileView'
            style={[commonStyles.flex, { backgroundColor: getMainInterfaceBackground(isDarkMode) }]}
        >
            <SafeAreaView style={[commonStyles.flex]} edges={['top', 'left', 'right']}>
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
                <ScrollView
                    style={[commonStyles.flex, styles.mainWrapper]}
                    contentContainerStyle={{ paddingBottom: bottomPadding }}
                    showsVerticalScrollIndicator={false}
                >
                    {currentUser.getCars().map((account, index) => {
                        return (
                            <View key={account.car?.getVin()}>
                                <CarRow key={account.car!.getVin()} carModel={account.car} email={account.getEmail()} index={index} editMode={editMode} />
                            </View>
                        );
                    })}
                    {currentUser.getSelectedCar() !== '' && (
                        <Text style={[commonStyles.smallText, styles.bottomText]}>
                            <View style={{ transform: [{ translateY: 4 }], paddingRight: 5 }}><Icon name="info" size={15} color={getBlackColour(isDarkMode)} /></View>
                            {currentUser.getSelectedCarName()}{' '}{languageHandler.getTranslation('isSelectedAsDefault')}
                        </Text>
                    )}
                </ScrollView>

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