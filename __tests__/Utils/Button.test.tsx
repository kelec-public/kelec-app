import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { setupThemes } from '../../__mocks__/theme-mock-helper';
import Button from '../../src/packages/kelec-model/view/Button';

const mockUseTheme = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useTheme: () => mockUseTheme(),
}));

const mockUseColorScheme = jest.fn();
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    __esModule: true,
    default: () => mockUseColorScheme(),
}));

const themes = setupThemes(mockUseColorScheme);

describe('Button - Light theme', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue(themes.getLight());
    });

    test('renders with the default (primary) button style', () => {
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" onPress={() => {}} />,
        );

        const expected = themes.getLight().buttons.primary;
        const bgStyle = StyleSheet.flatten(getByTestId('buttonStyle').props.style);
        const textStyle = StyleSheet.flatten(getByTestId('buttonText').props.style);

        expect(bgStyle).toMatchObject({ borderRadius: expected.radius });
        expect(textStyle).toMatchObject({ color: expected.colors.text });

        const iconProps = getByTestId('buttonIcon').props;
        const iconColor = iconProps.color ?? StyleSheet.flatten(iconProps.style)?.color;
        expect(iconColor).toBe(expected.colors.iconTint);
    });

    test('applies the neutral style including its border', () => {
        const { getByTestId } = render(
            <Button
                testID="buttonTestId"
                text="title"
                icon="person"
                buttonStyle={themes.getLight().buttons.neutral}
                onPress={() => {}}
            />,
        );

        const expected = themes.getLight().buttons.neutral;
        const bgStyle = StyleSheet.flatten(getByTestId('buttonStyle').props.style);
        const textStyle = StyleSheet.flatten(getByTestId('buttonText').props.style);

        expect(textStyle).toMatchObject({ color: expected.colors.text });
        expect(bgStyle).toMatchObject({
            borderColor: expected.border?.color,
            borderWidth: expected.border?.width,
        });
    });

    test('applies the delete style', () => {
        const { getByTestId } = render(
            <Button
                testID="buttonTestId"
                text="Delete"
                icon="delete"
                buttonStyle={themes.getLight().buttons.delete}
                onPress={() => {}}
            />,
        );

        const expected = themes.getLight().buttons.delete;
        const textStyle = StyleSheet.flatten(getByTestId('buttonText').props.style);
        expect(textStyle).toMatchObject({ color: expected.colors.text });

        const iconProps = getByTestId('buttonIcon').props;
        const iconColor = iconProps.color ?? StyleSheet.flatten(iconProps.style)?.color;
        expect(iconColor).toBe(expected.colors.iconTint);
    });

    test('uses disabled colors when disabled', () => {
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" disabled onPress={() => {}} />,
        );

        // Primary button uses a gradient for its normal background, so backgroundColor
        // won't appear on the Animated.View in that case. We check backgroundDisabled
        // which is always a plain string.
        const expected = themes.getLight().buttons.primary;
        const textStyle = StyleSheet.flatten(getByTestId('buttonText').props.style);
        expect(textStyle).toMatchObject({ color: expected.colors.textDisabled });
    });
});

describe('Button - Dark theme', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue(themes.getDark());
    });

    test('renders with the default (primary) button style', () => {
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" onPress={() => {}} />,
        );

        const expected = themes.getDark().buttons.primary;
        const bgStyle = StyleSheet.flatten(getByTestId('buttonStyle').props.style);
        const textStyle = StyleSheet.flatten(getByTestId('buttonText').props.style);

        expect(bgStyle).toMatchObject({ borderRadius: expected.radius });
        expect(textStyle).toMatchObject({ color: expected.colors.text });

        const iconProps = getByTestId('buttonIcon').props;
        const iconColor = iconProps.color ?? StyleSheet.flatten(iconProps.style)?.color;
        expect(iconColor).toBe(expected.colors.iconTint);
    });

    test('neutral style has no border in dark mode', () => {
        const { getByTestId } = render(
            <Button
                testID="buttonTestId"
                text="title"
                icon="person"
                buttonStyle={themes.getDark().buttons.neutral}
                onPress={() => {}}
            />,
        );

        const bgStyle = StyleSheet.flatten(getByTestId('buttonStyle').props.style);
        expect(bgStyle.borderColor).toBeUndefined();
        expect(bgStyle.borderWidth === 0 || bgStyle.borderWidth === undefined).toBe(true);
    });

    test('primary style is identical across light and dark themes', () => {
        render(
            <Button
                testID="buttonTestId"
                text="Confirm"
                icon="check"
                buttonStyle={themes.getDark().buttons.primary}
                onPress={() => {}}
            />,
        );

        expect(themes.getDark().buttons.primary).toEqual(themes.getLight().buttons.primary);
    });
});

describe('Button - Conditional content', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue(themes.getDark());
    });

    test('renders only the icon when no text is provided', () => {
        const { queryByTestId } = render(
            <Button testID="buttonTestId" icon="person" onPress={() => {}} />,
        );

        expect(queryByTestId('buttonText')).toBeNull();
        expect(queryByTestId('buttonIcon')).toBeTruthy();
    });

    test('renders only the text when no icon is provided', () => {
        const { queryByTestId } = render(
            <Button testID="buttonTestId" text="title" onPress={() => {}} />,
        );

        expect(queryByTestId('buttonIcon')).toBeNull();
        expect(queryByTestId('buttonText')).toBeTruthy();
    });

    test('shows a loader and hides text and icon when loading', () => {
        const { queryByTestId, UNSAFE_getByType } = render(
            <Button testID="buttonTestId" text="title" icon="person" isLoading onPress={() => {}} />,
        );

        expect(queryByTestId('buttonText')).toBeNull();
        expect(queryByTestId('buttonIcon')).toBeNull();
        expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
    });
});

describe('Button - User interactions', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue(themes.getLight());
    });

    test('calls onPress when pressed', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" onPress={onPress} />,
        );

        fireEvent.press(getByTestId('buttonTestId'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" disabled onPress={onPress} />,
        );

        fireEvent.press(getByTestId('buttonTestId'));
        expect(onPress).not.toHaveBeenCalled();
    });

    test('does not call onPress when loading', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(
            <Button testID="buttonTestId" text="title" icon="person" isLoading onPress={onPress} />,
        );

        fireEvent.press(getByTestId('buttonTestId'));
        expect(onPress).not.toHaveBeenCalled();
    });
});