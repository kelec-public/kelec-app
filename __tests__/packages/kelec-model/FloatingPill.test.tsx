import { StyleSheet, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import FloatingPill, { FLOATING_PILL_SIZE } from "../../../src/packages/kelec-model/view/FloatingPill";

const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

test('avec texte : hauteur minimale commune, mais peut grandir avec le contenu ou la ligne', () => {
    render(<FloatingPill viewTestID="pill"><Text>x</Text></FloatingPill>);
    expect(styleOf('pill')).toMatchObject({ minHeight: FLOATING_PILL_SIZE });
    expect(styleOf('pill').height).toBeUndefined();
});

test('ronde : taille fixe, jamais étirée', () => {
    render(<FloatingPill viewTestID="pill" round><Text>x</Text></FloatingPill>);
    expect(styleOf('pill')).toMatchObject({ width: FLOATING_PILL_SIZE, height: FLOATING_PILL_SIZE });
    expect(styleOf('pill').flexGrow).toBeUndefined();
    expect(styleOf('pill').aspectRatio).toBeUndefined();
});

test('sélectionnée : fond gris et bordure', () => {
    render(<FloatingPill viewTestID="pill" selected><Text>x</Text></FloatingPill>);
    expect(styleOf('pill')).toMatchObject({ borderColor: 'gray', backgroundColor: 'lightgray' });
});

test('cliquable seulement avec onPress', () => {
    const onPress = jest.fn();
    render(<FloatingPill testID="button" viewTestID="pill" onPress={onPress}><Text>x</Text></FloatingPill>);
    fireEvent.press(screen.getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
});

test('sans bouton, la pastille ne s\'élargit pas (pas de flexGrow)', () => {
    render(<FloatingPill viewTestID="pill"><Text>x</Text></FloatingPill>);
    expect(styleOf('pill').flexGrow).toBeUndefined();
});
