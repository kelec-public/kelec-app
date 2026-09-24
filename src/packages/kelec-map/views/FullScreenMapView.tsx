import { LayoutChangeEvent, StyleSheet, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useContext, useRef, useState } from "react";
import Text from "../../../screen/Common/CustomText";
import commonStyles from "../../../lib/graphics/commonStyle";
import MainContext from "../../../lib/Contexts/MainContext";
import { getBlackColour, getDisplayDate } from "../../../lib/graphics/utils";
import FloatingPill, { FLOATING_PILL_ICON_SIZE } from "../../kelec-model/view/FloatingPill";
import { usePreferences } from "../../kelec-preferences";
import { WeatherBadge } from "../../kelec-weather";
import { useCarImage } from "../../kelec-garage";
import CarMarker from "./CarMarker";
import { useCarLocation } from "../controllers/MapProvider";
import { openInMapsApp } from "../services/mapLinks";
import MapTypeSelector from "./MapTypeSelector";

const DELTA = 0.0222;

type Props = {
    readonly navigation: { goBack: () => void };
}

/** Carte plein écran : position de la voiture, météo, type de carte et itinéraire. */
const FullScreenMapView = ({ navigation }: Props): React.JSX.Element => {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    const { preferences, update: updatePreferences } = usePreferences();
    const { location, carModel, weather } = useCarLocation();
    const carName = carModel?.getModel() ?? '';
    const image = useCarImage(carModel?.getVin() ?? '');

    const mapRef = useRef<MapView>(null);
    const [hasRegionChanged, setHasRegionChanged] = useState<boolean>(false);
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

    const onMapLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setMapDimensions({ width, height });
    };

    const goBackToOriginalRegion = () => {
        if (!location) return;
        mapRef.current?.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: DELTA,
            longitudeDelta: DELTA,
        });
        setHasRegionChanged(false);
    };

    return (
        <View style={commonStyles.flex} testID="mapCardFullModal">
            <MapView
                testID="mapCardFullRegion"
                style={{ flex: 1 }}
                onLayout={onMapLayout}
                region={location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: DELTA,
                    longitudeDelta: DELTA,
                } : undefined}
                mapType={preferences.mapType}
                onPanDrag={() => setHasRegionChanged(true)}
                ref={mapRef}
            >
                {location && mapDimensions.width > 0 && mapDimensions.height > 0 && (
                    <CarMarker
                        location={location}
                        image={image}
                        size="large"
                        title={carName}
                        description={languageHandler.getTranslation("lastUpdated") + getDisplayDate(location.updatedAt)}
                    />
                )}
            </MapView>
            {/* en haut : retour + météo, sur la même ligne (même hauteur) */}
            <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
                <View style={styles.topRow} pointerEvents="box-none">
                    <FloatingPill testID="closeModalButton" onPress={() => navigation.goBack()}>
                        <Icon name="chevron-left" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                        <Text style={{ color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation("backToVehicle")}</Text>
                    </FloatingPill>
                    <WeatherBadge state={weather} />
                </View>
            </SafeAreaView>
            {/* en bas à droite : recentrer, type de carte, itinéraire */}
            {/* SafeAreaView : au-dessus de la barre d'accueil (la marge du bas s'applique aussi en modale) */}
            <SafeAreaView edges={['bottom']} style={styles.bottomArea} pointerEvents="box-none">
                <View style={styles.bottom} pointerEvents="box-none">
                    {hasRegionChanged && (
                        <View style={styles.bottomRow} pointerEvents="box-none">
                            <FloatingPill testID="resetFullRegionButton" onPress={goBackToOriginalRegion} round>
                                <Icon name="near-me" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                            </FloatingPill>
                        </View>
                    )}
                    <MapTypeSelector
                        selected={preferences.mapType}
                        onSelect={mapType => { updatePreferences({ mapType }); }}
                    />
                    <View style={styles.bottomRow} pointerEvents="box-none">
                        <FloatingPill testID="navigateToButton" onPress={() => location && openInMapsApp(location, carName)}>
                            <Text style={{ color: getBlackColour(isDarkMode) }}>{languageHandler.getTranslation("walkTo")} {carName}</Text>
                            <Icon name="directions" color={getBlackColour(isDarkMode)} size={FLOATING_PILL_ICON_SIZE}></Icon>
                        </FloatingPill>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
};

const styles = StyleSheet.create({
    top: {
        position: 'absolute',
        top: 0,
        width: '100%',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        marginHorizontal: 15,
        // la carte s'ouvre en modale : pas de marge de sécurité en haut
        marginTop: 15,
    },
    bottomArea: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    bottom: {
        margin: 15,
        gap: 15,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
    },
});

export default FullScreenMapView;
