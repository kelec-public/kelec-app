import { render, waitFor, screen, userEvent } from "@testing-library/react-native";
import App from "../../App";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.useFakeTimers();
// TO FIX. Onboarding was hidden bc of apple guidelines
/*
test('should show onboarding screen while opening the app', async () => {
    render(<App />);
    await screen.findByTestId('onboardingView');
});
*/

test('should not show onboarding screen after user has seen it', async () => {
    await AsyncStorage.setItem('onboarding', 'true');
    render(<App />);
    await waitFor(() => {
        expect(screen.queryByTestId('hasSeenOnboarding')).toBeNull();
    });
});

describe('Onboarding', () => {
    // TO FIX
    /*
    it('should display error message when user tries to submit empty form', async () => {
        const user = userEvent.setup();
        render(<App />);

        await waitFor(async () => {
            // check first and third checkbox
            const firstCheckbox = screen.getByTestId('checkbox0');
            expect(firstCheckbox).toBeTruthy();
            const thirdCheckbox = screen.getByTestId('checkbox2');
            firstCheckbox.props.onClick();
            await user.press(firstCheckbox);
            await user.press(thirdCheckbox);
        });


        let letsGoButton = screen.getByTestId('letsGoButton');
        await user.press(letsGoButton);
        await waitFor(async () => {

            // expect 2 texts inputs to be red color
            const secondCheckbox = screen.getByTestId('checkbox1');
            expect(secondCheckbox.props.children[0][1].props.children.props.style).toEqual(
                expect.arrayContaining([{ "color": "red", "textDecorationLine": "none" }])
            );
            const fourthCheckbox = screen.getByTestId('checkbox3');
            expect(fourthCheckbox.props.children[0][1].props.children.props.style).toEqual(
                expect.arrayContaining([{ "color": "red", "textDecorationLine": "none" }])
            );
        });

        // now check the four checkboxes

        const secondCheckbox = screen.getByTestId('checkbox1');
        const fourthCheckbox = screen.getByTestId('checkbox3');
        await user.press(secondCheckbox);
        await user.press(fourthCheckbox);
        await waitFor(() => {


        });

        // press again the letsGoButton
        letsGoButton = screen.getByTestId('letsGoButton');
        await user.press(letsGoButton);
    });
    */



});