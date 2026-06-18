import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import Text from "../../../../../../screen/Common/CustomText";
import { useContext, useRef, useState } from "react";
import MainContext from "../../../../../../lib/Contexts/MainContext";
import { fontFamilyBold, fontWeightBold } from "../../../../../kelec-model/lib/fonts";

type Props = {
    email: string;
    onChangeCode: (code: string) => void;
}

const TfaCodeView = ({ email, onChangeCode }: Props) => {
    const { languageHandler } = useContext(MainContext);

    const [userInputCode, setUserInputCode] = useState<string>('');

    const inputRef = useRef<TextInput>(null);


    const handleCodeChange = (text: string) => {
        const cleaned = text.replace(/\D/g, "").slice(0, AMOUNT_OF_CHARACTERS);
        setUserInputCode(cleaned);
        onChangeCode(cleaned);

        if (cleaned.length === AMOUNT_OF_CHARACTERS) {
            Keyboard.dismiss();
        }
    }



    const AMOUNT_OF_CHARACTERS = 6;

    const renderInputBoxes = () =>
        Array.from({ length: AMOUNT_OF_CHARACTERS }, (_, i) => {
            const isFilled = i < userInputCode.length;
            const isActive = i === userInputCode.length;
            return (
                <View
                    key={i}
                    style={[
                        styles.inputBox,
                        isFilled && styles.filledInputBox,
                        isActive && styles.activeInputBox
                    ]}
                >
                    <Text style={[styles.inputText, !isFilled && styles.placeholderText]}>
                        {userInputCode[i] ?? "·"}
                    </Text>
                </View>
            )
        });

    return (
        <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>

            {/* input réel masqué */}
            <TextInput
                ref={inputRef}
                value={userInputCode}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={AMOUNT_OF_CHARACTERS}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                style={styles.hiddenInput}
                caretHidden
                testID="tfaCodeInput"
            />
            <Text style={styles.mainTitle}>{languageHandler.getTranslation("aCodeHasBeenSentToYourEmail")}</Text>
            <Text>{email}</Text>
            <View style={styles.inputBoxes}>{renderInputBoxes()}</View>
        </Pressable>
    )
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold
    },
    inputBox: {
        width: 46,
        height: 56,
        borderWidth: 1.5,
        borderColor: "#D3D1C7",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    filledInputBox: {
        borderColor: "#888780",
    },
    activeInputBox: {
        borderColor: "#378ADD",
    },
    inputText: {
        fontSize: 22,
        fontWeight: fontWeightBold,
        fontFamily: fontFamilyBold,
    },
    placeholderText: {
        color: "#D3D1C7",
        fontWeight: "400",
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        width: 1,
        height: 1,
    },
    inputBoxes: {
        flexDirection: "row",
        gap: 10,
    },

});

export default TfaCodeView;