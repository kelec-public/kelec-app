import { StyleSheet } from "react-native";
import { spacerL, spacerXL } from "./Spacers";

export const CommonStyles = StyleSheet.create({
    container: {
        flex: 1
    },
    containerView: {
        flex: 1,
        paddingHorizontal: spacerL,
    },
    subView: {
        gap: spacerXL
    }
});