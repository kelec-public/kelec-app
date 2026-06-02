
import React from 'react';
import App from '../../App';
import { Alert } from 'react-native';

// Note: import explicitly to use the types shipped with jest.
import { it, expect, beforeEach } from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.spyOn(Alert, 'alert').mockImplementation(() => { });


jest.useFakeTimers();



beforeEach(async () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    await AsyncStorage.clear();
});


it('renders correctly', async () => {
    // empty localstorage so login screen should be displayed
    let component;
    await act(async () => {
        component = renderer.create(<App />);
    });
    const instance = component.root;
    expect(instance.findByProps({ testID: 'loginView' })).toBeTruthy();

    // touch on hyundai logo
    const hyundaiLogo = instance.findByProps({ testID: 'hyundaiLogo' });
    await act(async () => {
        hyundaiLogo.props.onPress();
    });
    let nextStepButton = instance.findByProps({ testID: 'nextStepButton' });
    expect(nextStepButton).toBeTruthy();
    await act(async () => {
        nextStepButton.props.onPress();
    });

    // check the text at the top is correct 
    let connectTo = instance.findByProps({ testID: 'credentialsStepViewSubtitle' });
    expect(connectTo.props.children).toBe("Je me connecte avec un compte Hyundai");

});


