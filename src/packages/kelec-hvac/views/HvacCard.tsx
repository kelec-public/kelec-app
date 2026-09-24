import { StyleSheet, TouchableOpacity, View, useColorScheme, Animated, Easing } from "react-native";
import { useContext, useEffect, useRef } from "react";
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from "react-native-linear-gradient";
import Text from "../../../screen/Common/CustomText";
import { getAccentOrange, getBlackColour, getGrayBackgroundColour, getWhiteColour } from "../../../lib/graphics/utils";
import MainContext from "../../../lib/Contexts/MainContext";
import CarViewContext from "../../../lib/Contexts/CarViewContext";
import { getTemperatureLabel } from "../models/Temperature";
import { useHvacCardController } from "../controllers/useHvacCardController";
import { getTemperatureColour, showsDegreeUnit } from "./temperatureStyle";
import HvacSheet from "./HvacSheet";

/** Carte préchauffage de la page voiture ; animée quand la climatisation tourne. */
function HvacCard(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { carModel, apiHandler } = useContext(CarViewContext);

    const controller = useHvacCardController(carModel.getVin());
    const { status, temperature } = controller;

    // Animations "climatisation en cours" : icône qui tourne, dégradé qui balaie la carte
    const iconRotation = useRef(new Animated.Value(0)).current;
    const progress = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(iconRotation, {
                toValue: 360,
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            })
        ).start();

        Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false, // on anime une largeur
                easing: Easing.linear
            })
        ).start();
    }, []);

    const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
    const smallTemperatureColour = getTemperatureColour(temperature, isDarkMode, true);

    return (
        <View>
            <HvacSheet
                visible={controller.isSheetOpen}
                onClose={controller.closeSheet}
                temperature={temperature}
                canDecrease={controller.canDecrease}
                canIncrease={controller.canIncrease}
                onDecrease={controller.decreaseTemperature}
                onIncrease={controller.increaseTemperature}
                showMinSocWarning={status.isBelowMinimumSoc(apiHandler.getBatteryLevel())}
                minimumSoc={status.minimumSoc}
                isLaunching={controller.isLaunching}
                onLaunch={controller.launchHvac}
            />
            <TouchableOpacity
                testID="HVACCardButton"
                onPress={controller.openSheet}
            >
                <View style={[styles.HVACCard, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]} testID="HVACCard">
                    {status.isRunning && (
                        <View testID="hvacRunningOverlay" style={StyleSheet.absoluteFill}>
                            <Animated.View style={[styles.gradient, { width: barWidth, opacity: opacity }]}>
                                <LinearGradient
                                    colors={[getWhiteColour(isDarkMode), getAccentOrange()]}
                                    style={{ flex: 1 }}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </Animated.View>
                        </View>
                    )}

                    <View style={styles.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {status.isRunning ? (
                                <Animated.View
                                    testID="animatedHvacIcon"
                                    style={{
                                        transform: [{
                                            rotate: iconRotation.interpolate({
                                                inputRange: [0, 360],
                                                outputRange: ['0deg', '360deg']
                                            })
                                        }]
                                    }}>
                                    <Icon name="ac-unit" size={20} color={getBlackColour(isDarkMode)} />
                                </Animated.View>
                            ) : (
                                <Icon testID="hvacIcon" name="ac-unit" size={20} color={getBlackColour(isDarkMode)} />
                            )}

                            <View style={{ marginLeft: 10 }}>
                                <Text style={{ fontSize: 18 }}>
                                    {languageHandler.getTranslation(status.isRunning ? "activePreHeat" : "preHeat")}
                                </Text>
                                <Text style={{ fontSize: 18, color: smallTemperatureColour }}>
                                    {getTemperatureLabel(temperature)}
                                    {showsDegreeUnit(temperature) && <Text style={{ fontSize: 18, color: smallTemperatureColour }}>°C</Text>}
                                </Text>
                            </View>
                        </View>
                        <Icon name="arrow-forward-ios" size={20} color={getBlackColour(isDarkMode)} />
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    HVACCard: {
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 7,
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gradient: {
        height: '100%',
        position: 'absolute',
    },
});

export default HvacCard;
