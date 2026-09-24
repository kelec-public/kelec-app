import { Fragment, useContext } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayBackgroundColour, getTopDarkColour } from "../../../lib/graphics/utils";
import Button from '../../kelec-model/view/Button';
import { TIMEZONE_OFFSETS } from "../services/timezoneOffsets";

type Props = {
    readonly visible: boolean;
    readonly selectedOffset: number;
    readonly onSelect: (offset: number) => void;
    readonly onClose: () => void;
}

/** Choix du décalage horaire appliqué aux charges programmées. */
function TimezoneOffsetModal({ visible, selectedOffset, onSelect, onClose }: Props): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaProvider>
                <SafeAreaView style={[styles.container, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
                    <View style={styles.content}>
                        <Text style={styles.title}>{languageHandler.getTranslation("timezoneOffset")}</Text>
                        <ScrollView>
                            <View style={{ gap: 5 }}>
                                {TIMEZONE_OFFSETS.map((offset, index) => (
                                    <Fragment key={offset}>
                                        <TouchableOpacity
                                            onPress={() => onSelect(offset)}
                                            testID={"timezoneOffsetButton" + offset}
                                            style={{
                                                backgroundColor: offset === selectedOffset ? getTopDarkColour(isDarkMode) : getGrayBackgroundColour(isDarkMode),
                                                borderRadius: 10
                                            }}
                                        >
                                            <View style={[commonStyles.rowFlex, styles.row]}>
                                                <Text>{offset}</Text>
                                                <Icon name="chevron-right" size={20} color={getBlackColour(isDarkMode)} />
                                            </View>
                                        </TouchableOpacity>
                                        {index !== TIMEZONE_OFFSETS.length - 1 && <View style={[commonStyles.navSeparator]}></View>}
                                    </Fragment>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <View style={{ paddingHorizontal: 15, marginBottom: 20 }}>
                        <Button
                            testID='addBackButton'
                            text={languageHandler.getTranslation("back")}
                            onPress={onClose}
                        />
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    content: {
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginVertical: 10,
    },
});

export default TimezoneOffsetModal;
