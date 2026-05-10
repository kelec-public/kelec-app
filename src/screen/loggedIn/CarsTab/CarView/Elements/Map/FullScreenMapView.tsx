
import { LayoutChangeEvent, StyleSheet, View, TouchableOpacity, useColorScheme, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../../../../../Common/CustomText";
import MapView, { MapType, Marker } from "react-native-maps";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import { useContext, useRef, useState } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import { getBlackColour, getDisplayDate, getLightGray, getWhiteColour } from "../../../../../../lib/graphics/utils";
import WeatherMapCard from "./WeatherMapCard";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CarsViewParamList } from "../../../CarsPageView";

type Props = NativeStackScreenProps<CarsViewParamList, 'MapView'>;

const FullScreenMapView = ({ route, navigation }: Props) => {
    const HYBRID_TYPE: string = Platform.OS === 'ios' ? 'hybridFlyover' : 'hybrid';

    const isDarkMode = useColorScheme() === 'dark';
    const { latitude, longitude, lastMapUpdateDate, image, weatherHandler, carModel } = route.params;
    const { appPreferences, languageHandler, storageHandler, reloadAppPreferences } = useContext(MainContext);

    const mapModalViewRef = useRef<MapView>(null);
    const [hasModalRegionChanged, setHasModalRegionChanged] = useState<boolean>(false);
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
    const onMapLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setMapDimensions({ width, height });
    };

    const onPanDrag = () => {
        setHasModalRegionChanged(true);
    }

    const saveMapType = async (mapType: MapType) => {
        appPreferences.mapType = mapType;
        await storageHandler.setAppPreferences(appPreferences);
        reloadAppPreferences();
    }

    const goBackToOriginalRegion = () => {
        mapModalViewRef.current?.animateToRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.0222,
            longitudeDelta: 0.0222,
        });
        setHasModalRegionChanged(false);
    }


    return (
        <View style={commonStyles.flex} testID="mapCardFullModal">
            <MapView
                testID="mapCardFullRegion"
                style={{
                    flex: 1,
                }}
                onLayout={onMapLayout}
                region={{
                    latitude: latitude,
                    longitude: longitude,
                    latitudeDelta: 0.0222,
                    longitudeDelta: 0.0222,
                }}
                mapType={appPreferences.mapType}
                onPanDrag={() => onPanDrag()}
                ref={mapModalViewRef}
            >
                {mapDimensions.width > 0 && mapDimensions.height > 0 && (
                    <Marker
                        coordinate={{
                            latitude: latitude,
                            longitude: longitude
                        }}
                        title={carModel.getModel()}
                        description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(lastMapUpdateDate)}
                    >


                        {/*     <View style={[styles.bigMarker, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                       <Image style={{ flex: 1, resizeMode: 'contain', transform: [{ rotate: '-45deg' }] }} source={{ uri: `data:image/jpeg;base64,${image}` }} />
                       </View> */}
                    </Marker>

                    /*  <Marker
                         coordinate={
                             {
                                 latitude: latitude,
                                 longitude: longitude,
                             }
                         }
                         title={carModel.getModel()}
                         description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(lastMapUpdateDate)}
                         centerOffset={{ x: 0, y: -46.6 }}
                     >
                         <View style={styles.bigMarkerWrapper}>
                             <View style={[styles.bigMarker, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                                 <Image style={{ flex: 1, resizeMode: 'contain', transform: [{ rotate: '-45deg' }] }} source={{ uri: `data:image/jpeg;base64,${image}` }} />
                             </View>
                         </View>
                     </Marker> */
                )}
            </MapView>
            {/*  top left button */}
            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, width: '100%' }}>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15 }}>
                    <View>
                        <TouchableOpacity
                            testID="closeModalButton"
                            onPress={() => {
                                navigation.goBack();
                            }}
                        >
                            <View
                                style={[styles.fullScreenButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                                <Icon name="chevron-left" color={getBlackColour(isDarkMode)} size={20}></Icon>
                                <Text style={{ color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation("backToVehicle")}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <WeatherMapCard weatherHandler={weatherHandler} />
                </View>
            </SafeAreaView>
            {/*  bottom right buttons */}
            <View style={{
                position: 'absolute',
                right: 15,
                bottom: 0,
            }}
            >
                <View style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                    {hasModalRegionChanged && (
                        <TouchableOpacity
                            testID="resetFullRegionButton"
                            onPress={() => {
                                goBackToOriginalRegion();
                            }}
                            style={{
                                alignItems: 'flex-end',
                            }}
                        >
                            <View
                                style={[styles.fullScreenButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                                <Icon name="near-me" color={getBlackColour(isDarkMode)} size={30}></Icon>

                            </View>
                        </TouchableOpacity>
                    )}
                    <View style={[commonStyles.flex, commonStyles.flexEnd, commonStyles.rowFlex]}>
                        <TouchableOpacity
                            testID="standardButton"
                            onPress={() => {
                                saveMapType('standard');
                            }}
                        >
                            <View
                                testID="standardButtonView"
                                style={[styles.fullScreenButton, {
                                    backgroundColor: appPreferences.mapType == 'standard' ? getLightGray(isDarkMode) : getWhiteColour(isDarkMode),
                                    borderColor: appPreferences.mapType == 'standard' ? 'gray' : 'transparent',
                                }, styles.withBorder, styles.reducedMargin]}

                            >

                                <Icon name="map" color={getBlackColour(isDarkMode)} size={30}></Icon>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            testID="satelliteButton"
                            onPress={() => {
                                saveMapType(HYBRID_TYPE as MapType);
                            }}
                        >
                            <View
                                testID="satelliteButtonView"
                                style={[styles.fullScreenButton, {
                                    backgroundColor: appPreferences.mapType == HYBRID_TYPE ? getLightGray(isDarkMode) : getWhiteColour(isDarkMode),
                                    borderColor: appPreferences.mapType == HYBRID_TYPE ? 'gray' : 'transparent',
                                }, styles.withBorder, styles.reducedMargin]}>

                                <Icon name="satellite" color={getBlackColour(isDarkMode)} size={30}></Icon>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        testID="navigateToButton"
                        onPress={() => {
                            if (Platform.OS == 'ios') {
                                Linking.openURL('maps://0,0?q=' + carModel.getModel() + '@' + latitude + ',' + longitude);
                            } else if (Platform.OS == 'android') {
                                Linking.openURL('geo:0,0?q=' + latitude + ',' + longitude + '(' + carModel.getModel() + ')');
                            }
                        }}
                    >
                        <View
                            style={[styles.fullScreenButton, { backgroundColor: getWhiteColour(isDarkMode) }]}
                        >
                            <Text style={{ color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation("walkTo")} {carModel.getModel()}</Text>
                            <Icon name="directions" color={getBlackColour(isDarkMode)} size={30}></Icon>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    bigMarkerWrapper: {
        width: 80,
        height: 96.6,
    },
    bigMarker: {
        width: 80,
        height: 80,
        borderRadius: 99,
        borderBottomRightRadius: 0,
        transform: [{ rotate: '45deg' }],
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 10,
    },
    fullScreenButton: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 999,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,
    },
    withBorder: {
        borderWidth: 3,
    },
    reducedMargin: {
        marginLeft: 5,
        marginRight: 5,
    },
});
export default FullScreenMapView;