import React, { useContext, useRef, useState } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import { getBlackColour, getDisplayDate } from "../../../lib/graphics/utils";
import FloatingPill, { FLOATING_PILL_ICON_SIZE } from "../../kelec-model/view/FloatingPill";
import MapView from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WeatherBadge } from "../../kelec-weather";
import { useCarImage } from "../../kelec-garage";
import CarMarker from "./CarMarker";
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
    const image = useCarImage(carModel?.getVin() ?? '');

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
                <CarMarker
                    location={location}
                    image={image}
                    title={carModel?.getModel()}
                    description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(location.updatedAt)}
                />
            </MapView>
            <View style={styles.overlay} pointerEvents="box-none">
                {/* météo et plein écran sur la même ligne : même hauteur */}
                <View style={styles.row} pointerEvents="box-none">
                    <WeatherBadge state={weather} />
                    <FloatingPill testID="fullScreenButton" onPress={() => navigation.navigate(MAP_ROUTE)} round>
                        <Icon name="open-in-full" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                    </FloatingPill>
                </View>
                {hasRegionChanged && (
                    <View style={[styles.row, styles.end]} pointerEvents="box-none">
                        <FloatingPill testID="resetSmallRegionButton" onPress={goBackToOriginalRegion} round>
                            <Icon name="near-me" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                        </FloatingPill>
                    </View>
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
        top: 10,
        left: 10,
        right: 10,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
    },
    end: {
        justifyContent: 'flex-end',
    },
});

export default MapCard;
