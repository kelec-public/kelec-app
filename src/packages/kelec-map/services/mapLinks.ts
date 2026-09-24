import { Linking, Platform } from "react-native";
import { MapType } from "react-native-maps";
import { CarLocation } from "../models/CarLocation";

/** Vue satellite avec noms de lieux : `hybridFlyover` sur iOS, `hybrid` sur Android. */
export const SATELLITE_MAP_TYPE: MapType = Platform.OS === 'ios' ? 'hybridFlyover' : 'hybrid';

/** Ouvre l'app de cartes du téléphone sur la position de la voiture. */
export const openInMapsApp = (location: CarLocation, label: string): void => {
    const { latitude, longitude } = location;
    if (Platform.OS === 'ios') {
        Linking.openURL('maps://0,0?q=' + label + '@' + latitude + ',' + longitude);
    } else if (Platform.OS === 'android') {
        Linking.openURL('geo:0,0?q=' + latitude + ',' + longitude + '(' + label + ')');
    }
};
