import React, { useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, View, useColorScheme, Image, TouchableOpacity } from "react-native";
import CarViewContext from "../../../../../lib/Contexts/CarViewContext";
import MainContext from "../../../../../lib/Contexts/MainContext";
import { getBlackColour, getDisplayDate, getWhiteColour } from "../../../../../lib/graphics/utils";
import MapView, { Marker } from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import WeatherMapCard from "./Map/WeatherMapCard";
import { WeatherApiHandler, WeatherClient } from "../../../../../lib/clients/weather/weatherClient";


type Props = {
    readonly navigation: any;
}
function MapCard({ navigation }: Props): React.JSX.Element {

    const isDarkMode = useColorScheme() === 'dark';

    const { image, apiHandler, carModel } = useContext(CarViewContext);
    const { languageHandler, appPreferences } = useContext(MainContext);

    const [hasSmallRegionChanged, setHasSmallRegionChanged] = useState<boolean>(false);

    const [weatherHandler, setWeatherHandler] = useState<WeatherApiHandler | undefined | null>(undefined);

    useEffect(() => {
        loadWeather();
    }, [apiHandler.getMapLatitude(), apiHandler.getMapLongitude()]);

    const loadWeather = async () => {
        try {
            const weatherClient = new WeatherClient();
            const weatherResponse = await weatherClient.getWeather(apiHandler.getMapLatitude(), apiHandler.getMapLongitude());
            const weatherApiHandler = new WeatherApiHandler(weatherResponse);
            setWeatherHandler(weatherApiHandler);
        } catch (error) {
            setWeatherHandler(null);
        }

    };




    const mapViewRef = useRef<MapView>(null);


    const onPanDrag = () => {
        setHasSmallRegionChanged(true);
    }

    const goBackToOriginalRegion = () => {
        mapViewRef.current?.animateToRegion({
            latitude: apiHandler.getMapLatitude(),
            longitude: apiHandler.getMapLongitude(),
            latitudeDelta: 0.0222,
            longitudeDelta: 0.0221,
        });
        setHasSmallRegionChanged(false);
    }



    if (appPreferences?.hideMap) {
        return <></>
    } else {
        return (
            <View
                style={styles.mapCard}
                testID="mapCard"
            >
                {/* map card */}
                <MapView
                    testID="mapCardSmallRegion"
                    style={styles.mapView}
                    ref={mapViewRef}
                    region={{
                        latitude: apiHandler.getMapLatitude(),
                        longitude: apiHandler.getMapLongitude(),
                        latitudeDelta: 0.0222,
                        longitudeDelta: 0.0222,
                    }}
                    mapType={appPreferences.mapType}
                    onPanDrag={() => onPanDrag()}
                >
                    <Marker
                        coordinate={
                            {
                                latitude: apiHandler.getMapLatitude(),
                                longitude: apiHandler.getMapLongitude(),
                            }
                        }
                        title={carModel.getModel()}
                        description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(apiHandler.getLastMapUpdateDate())}
                    /* centerOffset={{ x: 0, y: -28.3 }} */
                    >
                        {/* <View style={styles.smallMarkerWrapper}>
                            <View style={[styles.smallMarker, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                                <Image style={{ flex: 1, resizeMode: 'contain', transform: [{ rotate: '-45deg' }] }} source={{ uri: `data:image/jpeg;base64,${image}` }} />
                            </View>
                        </View> */}
                    </Marker>

                </MapView>
                <View style={{
                    zIndex: 99, elevation: 99,
                    position: 'absolute',
                    top: 10,
                    left: 10,
                }}>
                    <WeatherMapCard weatherHandler={weatherHandler} />
                </View>
                <View style={{
                    zIndex: 99, elevation: 99,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MapView', {
                            latitude: apiHandler.getMapLatitude(),
                            longitude: apiHandler.getMapLongitude(),
                            lastMapUpdateDate: apiHandler.getLastMapUpdateDate(),
                            image: image,
                            weatherHandler: weatherHandler,
                            carModel: carModel,
                        })}
                        testID="fullScreenButton"
                    >
                        <View
                            style={[styles.smallButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                            <Icon name="open-in-full" color={getBlackColour(isDarkMode)} size={20}></Icon>
                        </View>
                    </TouchableOpacity>
                    {hasSmallRegionChanged && (
                        <TouchableOpacity
                            testID="resetSmallRegionButton"
                            onPress={() => goBackToOriginalRegion()}
                        >
                            <View
                                style={[styles.smallButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                                <Icon name="near-me" color={getBlackColour(isDarkMode)} size={20}></Icon>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    mapCard: {
        marginHorizontal: 15,
        flex: 1,
        height: 200,
        borderRadius: 7
    },
    mapView: {
        flex: 1,
        borderRadius: 7
    },
    withBorder: {
        borderWidth: 3,
    },
    smallButton: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 999,
        marginRight: 10,
        marginTop: 10,
        marginLeft: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        gap: 5,
    },
    smallMarker: {
        width: 40,
        height: 40,
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
    smallMarkerWrapper: {
        width: 40,
        height: 48.3
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
    reducedMargin: {
        marginLeft: 5,
        marginRight: 5,
    },
});

export default MapCard;