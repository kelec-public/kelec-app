import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Marker } from "react-native-maps";
import CarMarker from "../../../src/packages/kelec-map/views/CarMarker";

const location = { latitude: 44.1, longitude: 4.09, updatedAt: new Date(0) };
const marker = () => screen.UNSAFE_getByType(Marker);

jest.useFakeTimers();

test('pointe du pin sur la position (Android : anchor, iOS : centerOffset)', () => {
    render(<CarMarker location={location} image="" />);
    expect(marker().props.anchor).toEqual({ x: 0.5, y: 1 });
    expect(marker().props.centerOffset.y).toBeLessThan(0);
    expect(marker().props.coordinate).toEqual({ latitude: 44.1, longitude: 4.09 });
});

test('sans photo : icône de voiture, et le marqueur est figé tout de suite', () => {
    render(<CarMarker location={location} image="" />);
    expect(screen.queryByTestId('carMarkerImage')).toBeNull();
    expect(marker().props.tracksViewChanges).toBe(false);
});

test('avec photo : se redessine jusqu\'au chargement de l\'image, puis se fige', () => {
    render(<CarMarker location={location} image="base64" />);
    const image = screen.getByTestId('carMarkerImage');
    expect(image.props.source).toEqual({ uri: 'data:image/jpeg;base64,base64' });
    expect(marker().props.tracksViewChanges).toBe(true);

    fireEvent(image, 'load');
    expect(marker().props.tracksViewChanges).toBe(false);
});

test('filet de sécurité : se fige même si l\'image ne signale jamais son chargement', () => {
    render(<CarMarker location={location} image="base64" />);
    expect(marker().props.tracksViewChanges).toBe(true);

    act(() => { jest.advanceTimersByTime(3000); });
    expect(marker().props.tracksViewChanges).toBe(false);
});

test('aucune rotation (elle débordait de la vue et était coupée sur Android)', () => {
    render(<CarMarker location={location} image="base64" size="large" />);
    const json = JSON.stringify(screen.toJSON());
    expect(json).not.toContain('rotate');
});
