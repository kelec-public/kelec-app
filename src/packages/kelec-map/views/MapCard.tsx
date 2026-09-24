import React, { useContext, useRef, useState } from "react";
import { StyleSheet, View, useColorScheme, TouchableOpacity } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import { getBlackColour, getDisplayDate, getWhiteColour } from "../../../lib/graphics/utils";
import MapView, { Marker } from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WeatherBadge } from "../../kelec-weather";
import { useCarLocation } from "../controllers/MapProvider";
import { MAP_ROUTE } from "../routes";

const DELTA = 0.0222;

type Props = {
    readonly navigation: { navigate: (route: typeof MAP_ROUTE) => void };
}

/** Mini-carte de la page voiture. À n'afficher que si `useCarLocation().isMapVisible`. */
function MapCard({ navigation }: Props): React.JSX.Element | null {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler, appPreferences } = useContext(MainContext);
    const { location, carModel, weather } = useCarLocation();

    const mapViewRef = useRef<MapView>(null);
    const [hasRegionChanged, setHasRegionChanged] = useState<boolean>(false);

    if (!location) return null;
    const { latitude, longitude } = location;

    const goBackToOriginalRegion = () => {
        mapViewRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: DELTA,
            longitudeDelta: 0.0221,
        });
        setHasRegionChanged(false);
    };

    return (
        <View
            style={styles.mapCard}
            testID="mapCard"
        >
            <MapView
                testID="mapCardSmallRegion"
                style={styles.mapView}
                ref={mapViewRef}
                region={{ latitude, longitude, latitudeDelta: DELTA, longitudeDelta: DELTA }}
                mapType={appPreferences.mapType}
                onPanDrag={() => setHasRegionChanged(true)}
            >
                <Marker
                    coordinate={{ latitude, longitude }}
                    title={carModel?.getModel()}
                    description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(location.updatedAt)}
                /* centerOffset={{ x: 0, y: -28.3 }} */
                >
                    {/* Marqueur avec la photo de la voiture : désactivé car bogué, à reprendre.
                        `image` : useCarImage(vin) de kelec-garage.
                        <View style={styles.smallMarkerWrapper}>
                        <View style={[styles.smallMarker, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                            <Image style={{ flex: 1, resizeMode: 'contain', transform: [{ rotate: '-45deg' }] }} source={{ uri: `data:image/jpeg;base64,${image}` }} />
                        </View>
                    </View> */}
                </Marker>
            </MapView>
            <View style={[styles.overlay, { top: 10, left: 10 }]}>
                <WeatherBadge state={weather} />
            </View>
            <View style={[styles.overlay, { top: 0, right: 0 }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate(MAP_ROUTE)}
                    testID="fullScreenButton"
                >
                    <View style={[styles.smallButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                        <Icon name="open-in-full" color={getBlackColour(isDarkMode)} size={20}></Icon>
                    </View>
                </TouchableOpacity>
                {hasRegionChanged && (
                    <TouchableOpacity
                        testID="resetSmallRegionButton"
                        onPress={goBackToOriginalRegion}
                    >
                        <View style={[styles.smallButton, { backgroundColor: getWhiteColour(isDarkMode) }]}>
                            <Icon name="near-me" color={getBlackColour(isDarkMode)} size={20}></Icon>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
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
    overlay: {
        zIndex: 99,
        elevation: 99,
        position: 'absolute',
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
    // utilisés par le marqueur commenté ci-dessus
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
});

export default MapCard;
