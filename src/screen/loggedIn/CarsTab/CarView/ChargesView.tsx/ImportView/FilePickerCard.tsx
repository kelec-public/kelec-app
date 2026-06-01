import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../../../Common/CustomText";
import KelecCard from "../../../../../../packages/kelec-model/view/Card";
import { NEUTRAL_100, PRIMARY_COLOUR } from "../../../../../../packages/kelec-model/lib/colours";

type FilePickerCardProps = {
    readonly onPress: () => void;
};

function FilePickerCard({ onPress }: FilePickerCardProps): React.JSX.Element {
    return (
        <KelecCard
            onPress={onPress}
            testID="filePickerCard"
        >
            <View
                style={styles.card}
            >
                <View style={styles.iconCircle}>
                    <Icon name="upload-file" size={26} color={PRIMARY_COLOUR} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Sélectionner un fichier</Text>
                    <Text style={styles.subtitle}>Formats acceptés: .xlsx</Text>
                </View>
            </View>
        </KelecCard>

    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 25,
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: NEUTRAL_100,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        marginTop: 16,
        gap: 4,
        alignItems: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
    },
});

export default FilePickerCard;
