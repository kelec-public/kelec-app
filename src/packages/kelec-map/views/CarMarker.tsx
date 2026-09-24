import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Marker } from "react-native-maps";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBlackColour, getWhiteColour } from "../../../lib/graphics/utils";
import { toImageUri } from "../../kelec-garage";
import { CarLocation } from "../models/CarLocation";

const SIZES = { small: 44, large: 72 };
/** Hauteur de la pointe, proportionnelle au rond. */
const POINTER_RATIO = 0.3;
/** Marge autour du pin : Android dessine le marqueur en image à la taille de la vue, tout ce qui dépasse est coupé. */
const OUTER_PADDING = 4;
const READY_TIMEOUT_MS = 3000;

type Props = {
    readonly location: CarLocation;
    /** Image de la voiture (base64), '' si aucune. */
    readonly image: string;
    readonly title?: string;
    readonly description?: string;
    readonly size?: keyof typeof SIZES;
};

/**
 * Pin de la voiture : un rond avec la photo de la voiture et une pointe en dessous, posée sur la position.
 * Pas de rotation ni d'`elevation` (ils débordaient de la vue et étaient coupés sur Android).
 */
function CarMarker({ location, image, title, description, size = 'small' }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const diameter = SIZES[size];
    const pointerHeight = Math.round(diameter * POINTER_RATIO);
    const totalHeight = diameter + pointerHeight + 2 * OUTER_PADDING;

    // Android fige le marqueur en image : on le laisse se redessiner jusqu'au chargement de la photo.
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        setIsReady(image === '');
        // filet de sécurité si l'image ne signale jamais son chargement
        const timer = setTimeout(() => setIsReady(true), READY_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [image]);

    const background = getWhiteColour(isDarkMode);

    return (
        <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={title}
            description={description}
            tracksViewChanges={!isReady}
            // pointe du pin sur la position : anchor (Android), centerOffset (iOS)
            anchor={{ x: 0.5, y: 1 }}
            centerOffset={{ x: 0, y: -totalHeight / 2 }}
        >
            {/* collapsable={false} : empêche la nouvelle architecture d'aplatir cette vue, ce qui fausse
                la taille de l'image du marqueur sur Android (seul le coin haut-gauche était dessiné). */}
            <View
                testID="carMarker"
                collapsable={false}
                style={[styles.container, { width: diameter + 2 * OUTER_PADDING, height: totalHeight }]}
            >
                <View
                    style={[styles.circle, {
                        width: diameter,
                        height: diameter,
                        borderRadius: diameter / 2,
                        backgroundColor: background,
                    }]}
                >
                    <View style={[styles.clip, { borderRadius: diameter / 2 }]}>
                        {image !== '' ? (
                            <Image
                                testID="carMarkerImage"
                                source={{ uri: toImageUri(image) }}
                                style={{ width: diameter * 0.85, height: diameter * 0.85 }}
                                resizeMode="contain"
                                onLoad={() => setIsReady(true)}
                                onError={() => setIsReady(true)}
                            />
                        ) : (
                            <Icon name="directions-car" size={diameter * 0.5} color={getBlackColour(isDarkMode)} />
                        )}
                    </View>
                </View>
                <View
                    style={[styles.pointer, {
                        borderLeftWidth: pointerHeight * 0.6,
                        borderRightWidth: pointerHeight * 0.6,
                        borderTopWidth: pointerHeight,
                        borderTopColor: background,
                    }]}
                />
            </View>
        </Marker>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: OUTER_PADDING,
    },
    circle: {
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.15)',
        // ombre iOS seulement : sur Android, elevation déborde de la vue et serait coupée
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
            },
        }),
    },
    clip: {
        // couche séparée : overflow hidden sur le rond masquerait aussi son ombre (iOS)
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointer: {
        width: 0,
        height: 0,
        marginTop: -1, // colle la pointe au rond
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        backgroundColor: 'transparent',
    },
});

export default CarMarker;
