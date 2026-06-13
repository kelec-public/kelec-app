import { TouchableOpacity, StyleSheet, View, useColorScheme, Image } from "react-native";
import Text from "../../../../Common/CustomText";
import { formatNumberWithSpaces, getBlackColour, getGrayBackgroundColour } from "../../../../../lib/graphics/utils";
import { useContext } from "react";
import CarViewContext from "../../../../../lib/Contexts/CarViewContext";
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MainContext from "../../../../../lib/Contexts/MainContext";
import { fontFamilyBold, fontWeightBold } from "../../../../../lib/graphics/commonStyle";

type SummaryCardProps = {
    readonly navigation: any;
}

function SummaryCard({ navigation }: SummaryCardProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const { image, apiHandler, carType, loadCarModel, carModel } = useContext(CarViewContext);
    const { appPreferences } = useContext(MainContext);

    return (
        <View style={[styles.summaryCard, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]} testID="summaryCard">
            <Image style={styles.carImage} source={{ uri: `data:image/jpeg;base64,${image}` }} />
            <TouchableOpacity onPress={() => {
                navigation.navigate("CarModelSelector", {
                    carModel: carModel,
                    onConfirmUpdate: async () => {
                        loadCarModel();
                        navigation.goBack();
                    },
                    title: "carModel",
                    nextButtonText: "confirm",
                    backButtonText: "cancel",
                    safeAreaEdges: ['top'],
                });

            }}
                testID={'openModalButton'}
                style={{ position: 'absolute', top: 15, right: 15, zIndex: 99, elevation: 99 }}
            >
                <Icon name="settings" size={20} color={getBlackColour(isDarkMode)} />
            </TouchableOpacity>
            <View style={[styles.spaceAround, { flexWrap: "wrap" }]}>
                <View style={{ justifyContent: 'center' }}>
                    <View style={styles.element}>
                        <MaterialIcon name="ev-station" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                        <Text style={styles.elementText} testID="summaryCardRange">{apiHandler.getCarRange(appPreferences)}<Text style={styles.elementSmallText}>{' ' + appPreferences.distanceUnits}</Text></Text>
                    </View>
                    {/* display fuel range only if car has an ice engine */}
                    {apiHandler.getIsCarICE() && (
                        <>
                            <View style={styles.element}>
                                <MaterialIcon name="gas-station" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                                <Text style={styles.elementText} testID="summaryCardICERange">{apiHandler.getICERange(appPreferences)}<Text style={styles.elementSmallText}>{' ' + appPreferences.distanceUnits}</Text></Text>
                            </View>
                            <View style={styles.vSeparator}></View>
                            <View style={styles.element}>
                                <MaterialIcon name="map-marker-distance" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                                <Text style={styles.elementText} testID="summaryCardAllEnginesRange">{apiHandler.getAllEnginesRange(appPreferences)}<Text style={styles.elementSmallText}>{' ' + appPreferences.distanceUnits}</Text></Text>
                            </View>
                        </>
                    )}


                </View>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ justifyContent: 'center', gap: 5 }}>
                        <View style={styles.element}>
                            <MaterialIcon name="speedometer" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                            <Text style={styles.elementText} testID="summaryCardOdometer">{formatNumberWithSpaces(apiHandler.getCarMileage(appPreferences))}<Text style={styles.elementSmallText}>{` ${appPreferences.distanceUnits}`}</Text></Text>
                        </View>
                        {/* display mileage under or over in case of a leasing */}
                        {carType.getLeasingData() && (
                            <View style={styles.element}>
                                {
                                    carType.getMaximumLeasingMileage() > apiHandler.getCarMileage(appPreferences) ? (
                                        <MaterialIcon testID="summaryCardLeasingMileageUnder" name="arrow-bottom-right-thin-circle-outline" size={20} color="green"></MaterialIcon>

                                    ) : (
                                        <MaterialIcon testID="summaryCardLeasingMileageOver" name="arrow-top-right-thin-circle-outline" size={20} color="red"></MaterialIcon>
                                    )
                                }
                                <Text style={styles.elementText} testID="summaryCardLeasingMileage">{formatNumberWithSpaces(Math.abs(apiHandler.getCarMileage(appPreferences) - carType.getMaximumLeasingMileage()))}<Text style={styles.elementSmallText}>{` ${appPreferences.distanceUnits}`}</Text></Text>
                            </View>
                        )}
                    </View>

                </View>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ justifyContent: 'center' }}>
                        <View style={styles.element} testID="summaryCardEstimatedEnergy">
                            <MaterialIcon name="battery-medium" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                            <Text style={styles.elementText} testID="summaryCardEstimatedEnergyText">{apiHandler.getAvailableEnergy(carType)}<Text style={styles.elementSmallText}>{' kWh'}</Text></Text>
                        </View>
                        {/* display fuel level only if car has an ice engine  */}
                        {apiHandler.getIsCarICE() && (
                            <View style={styles.element} testID="summaryCardEstimatedEnergy">
                                <MaterialIcon name="fuel" size={20} color={getBlackColour(isDarkMode)}></MaterialIcon>
                                <Text style={styles.elementText} testID="summaryCardEstimatedICEEnergyText">{apiHandler.getICEFuelLevel()}<Text style={styles.elementSmallText}>{' l'}</Text></Text>
                            </View>
                        )}

                    </View>
                </View>

            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    summaryCard: {
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 7,
        marginTop: 50
    },
    carImage: {
        width: '100%',
        height: 150,
        resizeMode: 'contain',
        marginTop: -80,
        marginBottom: 20
    },
    spaceAround: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    element: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    elementText: {
        fontFamily: fontFamilyBold,
        fontWeight: fontWeightBold,
        fontSize: 20
    },
    elementSmallText: {
        color: 'gray',
        fontSize: 14
    },
    vSeparator: {
        width: '100%',
        height: 1,
        marginVertical: 5,
        backgroundColor: 'gray'
    },
});
export default SummaryCard;