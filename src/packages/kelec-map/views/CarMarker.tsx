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
/** Taille de la photo dans le rond. */
const PHOTO_RATIO = 0.85;
/** Marge autour du pin : Android dessine le marqueur en image à la taille de la vue, tout ce qui dépasse est coupé. */
const OUTER_PADDING = 4;
const BORDER = 2;
const READY_TIMEOUT_MS = 3000;
/** Délai après le chargement de la photo avant de figer le marqueur : laisse le temps au dernier rendu natif. */
const FREEZE_DELAY_MS = 300;

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
 *
 * Contraintes Android (react-native-maps dessine le marqueur en image, hors de l'affichage normal) :
 * - la photo doit être un **enfant direct** du Marker : react-native-maps ne déclenche le chargement
 *   d'une <Image> (et le redessin une fois affichée) que pour ses enfants directs. Imbriquée, elle ne charge jamais ;
 * - pas de rotation ni d'`elevation` : elles débordent de la vue et sont coupées.
 */
function CarMarker({ location, image, title, description, size = 'small' }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const diameter = SIZES[size];
    const pointerHeight = Math.round(diameter * POINTER_RATIO);
    const totalHeight = diameter + pointerHeight + 2 * OUTER_PADDING;
    const photoSize = Math.round(diameter * PHOTO_RATIO);
    const photoOffset = OUTER_PADDING + (diameter - photoSize) / 2;

    // Le marqueur est figé en image : on le laisse se redessiner jusqu'au chargement de la photo.
    const [isReady, setIsReady] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    useEffect(() => {
        setIsImageLoaded(false);
        setIsReady(image === '');
        // filet de sécurité si l'image ne signale jamais son chargement
        const timer = setTimeout(() => setIsReady(true), READY_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [image]);
    useEffect(() => {
        if (!isImageLoaded) return;
        // onLoad = image décodée, pas encore dessinée : on attend un peu avant de figer
        const timer = setTimeout(() => setIsReady(true), FREEZE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [isImageLoaded]);

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
            {/* 1er enfant : le pin (rond + pointe), qui donne sa taille au marqueur */}
            <View testID="carMarker" style={[styles.container, { width: diameter + 2 * OUTER_PADDING, height: totalHeight }]}>
                <View
                    style={[styles.circle, {
                        width: diameter,
                        height: diameter,
                        borderRadius: diameter / 2,
                        backgroundColor: background,
                    }]}
                >
                    {image === '' && (
                        <Icon name="directions-car" size={diameter * 0.5} color={getBlackColour(isDarkMode)} />
                    )}
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
            {/* 2e enfant, direct : la photo, posée dans le rond (voir la contrainte Android ci-dessus) */}
            {image !== '' && (
                <Image
                    testID="carMarkerImage"
                    source={{ uri: toImageUri(image) }}
                    style={[styles.photo, {
                        top: photoOffset,
                        left: photoOffset,
                        width: photoSize,
                        height: photoSize,
                        borderRadius: photoSize / 2,
                        backgroundColor: background,
                    }]}
                    resizeMode="contain"
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setIsReady(true)}
                />
            )}
        </Marker>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: OUTER_PADDING,
    },
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: BORDER,
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
    photo: {
        position: 'absolute',
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
