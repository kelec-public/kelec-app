import { Text } from "react-native";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import StepLayout from "../../../src/packages/kelec-model/view/StepLayout";
import SwitchCard from "../../../src/packages/kelec-model/view/SwitchCard";

const theme = { ...DefaultTheme, buttons: { neutral: { colors: { background: 'grey', text: 'black' } }, primary: { colors: { background: 'blue', text: 'white' } } } } as any;
const renderWithTheme = (ui: React.ReactElement) => render(<ThemeProvider value={theme}>{ui}</ThemeProvider>);

describe('StepLayout', () => {
    test('affiche les textes tels quels (déjà traduits)', () => {
        renderWithTheme(<StepLayout testID="step" title="Ajouter une voiture" subtitle="La marque"><Text>contenu</Text></StepLayout>);
        expect(screen.getByText('Ajouter une voiture')).toBeDefined();
        expect(screen.getByTestId('stepSubtitle').props.children).toBe('La marque');
    });

    test('croix de fermeture seulement avec onDismiss', () => {
        const onDismiss = jest.fn();
        const { rerender } = renderWithTheme(<StepLayout title="t"><Text>x</Text></StepLayout>);
        expect(screen.queryByTestId('addBackButton')).toBeNull();

        rerender(<ThemeProvider value={theme}><StepLayout title="t" onDismiss={onDismiss}><Text>x</Text></StepLayout></ThemeProvider>);
        fireEvent.press(screen.getByTestId('addBackButton'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});

describe('SwitchCard', () => {
    test('toute la ligne bascule l\'option', () => {
        const onValueChange = jest.fn();
        const { rerender } = renderWithTheme(
            <SwitchCard testID="option" icon="ev-station" label="V2G" value={false} onValueChange={onValueChange}>
                <Text>détails</Text>
            </SwitchCard>,
        );
        fireEvent.press(screen.getByTestId('option'));
        expect(onValueChange).toHaveBeenCalledWith(true);

        rerender(<ThemeProvider value={theme}><SwitchCard testID="option" icon="ev-station" label="V2G" value={true} onValueChange={onValueChange} /></ThemeProvider>);
        fireEvent.press(screen.getByTestId('option'));
        expect(onValueChange).toHaveBeenLastCalledWith(false);
    });
});
