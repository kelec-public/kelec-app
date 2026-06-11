import { StyleSheet, TouchableOpacity, View, useColorScheme, Alert, Animated, Easing } from "react-native";
import Text from "../../../../Common/CustomText";
import { getAccentOrange, getBlackColour, getGrayBackgroundColour, getWhiteColour } from "../../../../../lib/graphics/utils";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext, useEffect, useRef, useState } from "react";
import MainContext from "../../../../../lib/Contexts/MainContext";
import CarsViewContext from "../../../../../lib/Contexts/CarsViewContext";
import commonStyles, { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";
import BigButton from "../../../../Common/BigButton";
import CarViewContext from "../../../../../lib/Contexts/CarViewContext";
import LinearGradient from "react-native-linear-gradient";
import TemperatureHandler from "../../../../../lib/model/TemperatureHandler";
import InfoPopup from "../../../../Common/InfoPopup";
import BottomSheet from "../../../../Common/bottomSheet/BottomSheet";
import Button from '../../../../../packages/kelec-model/view/Button';


function HVACCard(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { languageHandler } = useContext(MainContext);
    const { account, apiHandler } = useContext(CarViewContext);
    const { handleModalAnim } = useContext(CarsViewContext);

    const [shouldOpenHVACModal, setShouldOpenHVACModal] = useState<boolean>(false);
    const [isLoadingHVAC, setIsLoadingHVAC] = useState<boolean>(false);

    const temperatures = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
    const [index, setIndex] = useState<number>(4); // the index in the temperatures array

    // for when the climate is on
    const hvacImageRotation = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        loadDefaultTemperature();

        // make an animation so hvacImage continously goes from 0 to 360
        Animated.loop(
            Animated.timing(hvacImageRotation, {
                toValue: 360,
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            })
        ).start();


        Animated.loop(
            Animated.timing(progress, {
                toValue: 1, // Progress to 100%
                duration: 2000, // Duration in milliseconds
                useNativeDriver: false, // `false` because we're animating width
                easing: Easing.linear
            })
        ).start();
    }, []);

    const loadDefaultTemperature = async () => {
        // at the beggining, try to get the default temperature stored
        const storedTemperature = await TemperatureHandler.getTemperature(account.car?.getVin() ?? '');
        const index = temperatures.indexOf(storedTemperature);
        if (index !== -1) {
            setIndex(index);
        }
    };

    const progress = useRef(new Animated.Value(0)).current;
    const barWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'], // Interpolates from 0% to 100%
    });

    const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 0], // Interpolates from 0% to 100%
    });


    const getTemperatureText = (): string => {
        switch (temperatures[index]) {
            case 17:
                return 'LOW';
            case 27:
                return 'HIGH';
            default:
                return temperatures[index].toString();
        }
    }

    const getTemperatureTextColour = (small: boolean = false): string => {
        if (getTemperatureText() == 'LOW') {
            return 'blue';
        } else if (getTemperatureText() == 'HIGH') {
            return 'red';
        } else {
            return small ? 'gray' : getBlackColour(isDarkMode);
        }
    }

    return (
        <View>
            <BottomSheet
                testID="HVACModal"
                title={languageHandler.getTranslation("preHeat")}
                visible={shouldOpenHVACModal}
                onClose={() => {
                    setShouldOpenHVACModal(false);
                    handleModalAnim(false);
                }}
            >
                {/* temperature pickers */}
                <View style={[commonStyles.rowFlex, commonStyles.spaceBetween, styles.marginVertical]}>
                    {/* + button */}
                    <View style={[commonStyles.centerFlex]}>
                        <TouchableOpacity
                            testID="HVACCardLowButton"
                            disabled={index == 0}
                            onPress={async () => {
                                if (index > 0) {
                                    setIndex(index - 1)
                                    await TemperatureHandler.setTemperature(account.car?.getVin() ?? '', temperatures[index - 1]);
                                }

                            }}
                            style={[styles.temperatureButton, { opacity: index == 0 ? 0.4 : 1 }]}
                        >
                            <Icon name="remove" size={25} color='black' />
                        </TouchableOpacity>
                    </View>
                    {/* middle text */}
                    <View style={commonStyles.rowFlex}>
                        <Text
                            testID="temperatureText"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={{
                                color: getTemperatureTextColour(), fontFamily: fontFamilyBold,
                                fontWeight: fontWeightBold, fontSize: 60,
                            }}>{getTemperatureText()}</Text>
                        {index > 0 && index < temperatures.length - 1 && <Text testID="degreeText" style={{
                            color: getBlackColour(isDarkMode), fontFamily: fontFamilyBold,
                            fontWeight: fontWeightBold, fontSize: 60
                        }}>°C</Text>}
                    </View>
                    {/* - button */}
                    <View style={[commonStyles.centerFlex]}>
                        <TouchableOpacity
                            testID="HVACCardHighButton"
                            disabled={index == temperatures.length - 1}
                            onPress={async () => {
                                if (index < temperatures.length - 1) {
                                    setIndex(index + 1)
                                    await TemperatureHandler.setTemperature(account.car?.getVin() ?? '', temperatures[index + 1]);
                                }
                            }}
                            style={[styles.temperatureButton, { opacity: index == temperatures.length - 1 ? 0.4 : 1 }]}
                        >
                            <Icon name="add" size={25} color='black' />
                        </TouchableOpacity>
                    </View>
                </View>
                {((apiHandler.getMinimumHvacSOC() ?? Infinity) >= apiHandler.getBatteryLevel()) && (
                    <InfoPopup
                        backgroundColour={apiHandler.getMinimumHvacSOC() == null ? '#FFCCB3' : '#F4B6B6'}
                        icon={"warning"}
                        iconColour={'#7A1F1F'}
                    >
                        <>
                            {apiHandler.getMinimumHvacSOC() == null && (
                                <Text style={{ color: 'black', flexShrink: 1, }}>{languageHandler.getTranslation("hvacMinSocUnknown")}</Text>
                            )}
                            {apiHandler.getMinimumHvacSOC() != null && (
                                <Text style={{ color: 'black', flexShrink: 1, }}>{languageHandler.getTranslation("hvacUnderMinSoc")} {apiHandler.getMinimumHvacSOC()}%</Text>
                            )}
                        </>
                    </InfoPopup>
                )}

                <View style={[commonStyles.navSeparator, { marginBottom: 10 }]}></View>
                <Button
                    disabled={isLoadingHVAC}
                    testID={'confirmButton'}
                    isLoading={isLoadingHVAC}
                    onPress={async () => {
                        // launch hvac
                        setIsLoadingHVAC(true);
                        const hasLaunchedHVAC = await account.launchHVAC(temperatures[index]);
                        if (hasLaunchedHVAC) {
                            Alert.alert(languageHandler.getTranslation("informationSent"), languageHandler.getTranslation("preHeatLaunched"));
                            // close modal
                            setShouldOpenHVACModal(false);
                            handleModalAnim(false);
                        } else {
                            Alert.alert(languageHandler.getTranslation("error"), languageHandler.getTranslation("commandSendError"));
                        }
                        setIsLoadingHVAC(false);

                    }}
                    icon={"ac-unit"}
                    text={languageHandler.getTranslation("launchPreHeat")}
                />
            </BottomSheet>
            <TouchableOpacity
                testID="HVACCardButton"
                onPress={() => {
                    setShouldOpenHVACModal(true);
                    // black transparent background
                    handleModalAnim(true);
                }}
            >
                <View style={[styles.HVACCard, { backgroundColor: getGrayBackgroundColour(isDarkMode), position: 'relative' }]} testID="HVACCard">
                    {apiHandler.getIsHVACRunning() && (
                        <View
                            testID="hvacRunningOverlay"
                            style={{
                                position: 'absolute',
                                width: 'auto',
                                height: 'auto',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                            }}>
                            <View
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                }}
                            />

                            <Animated.View style={[{
                                height: '100%',
                                position: 'absolute',
                            }, { width: barWidth, opacity: opacity }]}>
                                <LinearGradient
                                    colors={[getWhiteColour(isDarkMode), getAccentOrange()]}
                                    style={{ flex: 1 }}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </Animated.View>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {apiHandler.getIsHVACRunning() && (
                                    <Animated.View
                                        testID="animatedHvacIcon"
                                        style={{
                                            transform: [
                                                {
                                                    rotate: hvacImageRotation.interpolate({
                                                        inputRange: [0, 360],
                                                        outputRange: ['0deg', '360deg']
                                                    })
                                                }
                                            ]
                                        }}>
                                        <Icon name="ac-unit" size={20} color={getBlackColour(isDarkMode)} />
                                    </Animated.View>
                                )}
                                {!apiHandler.getIsHVACRunning() && (
                                    <Icon testID="hvacIcon" name="ac-unit" size={20} color={getBlackColour(isDarkMode)} />
                                )}

                                <View style={{ marginLeft: 10 }}>
                                    {apiHandler.getIsHVACRunning() && (
                                        <Text style={{ fontSize: 18 }}>{languageHandler.getTranslation("activePreHeat")}</Text>
                                    )}
                                    {!apiHandler.getIsHVACRunning() && (
                                        <Text style={{ fontSize: 18 }}>{languageHandler.getTranslation("preHeat")}</Text>
                                    )}
                                    <Text style={{ fontSize: 18, color: getTemperatureTextColour(true) }}>
                                        {getTemperatureText()}
                                        {index > 0 && index < temperatures.length - 1 && <Text style={{ fontSize: 18, color: getTemperatureTextColour(true) }}>°C</Text>}
                                    </Text>

                                </View>
                            </View>
                        </View>
                        <Icon name="arrow-forward-ios" size={20} color={getBlackColour(isDarkMode)} />
                    </View>
                </View>
            </TouchableOpacity >
        </View >
    )
}

const styles = StyleSheet.create({
    HVACCard: {
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 7,
    },
    temperatureButton: {
        backgroundColor: 'rgb(220,220,220)',
        padding: 10,
        borderRadius: 10
    },
    marginVertical: {
        marginTop: 20,
        marginBottom: 20
    }
});

export default HVACCard;