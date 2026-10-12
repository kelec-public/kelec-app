import { Fragment, useContext } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import MainContext from "../../../lib/Contexts/MainContext";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayBackgroundColour, getTopDarkColour } from "../../../lib/graphics/utils";
import Button from '../../kelec-model/view/Button';

export type Choice<T> = {
    readonly value: T;
    readonly label: string;
    readonly testID: string;
};

type ContentProps<T> = {
    readonly title: string;
    readonly choices: Choice<T>[];
    readonly selected: T;
    readonly onSelect: (value: T) => void;
    readonly onClose: () => void;
}

type Props<T> = ContentProps<T> & {
    readonly visible: boolean;
}

/** Choix d'une valeur dans une liste (ex. décalage horaire des charges programmées, thème). */
function ChoiceModal<T>({ visible, ...props }: Props<T>): React.JSX.Element {
    return (
        <Modal animationType="slide" visible={visible} onRequestClose={props.onClose}>
            {/* les marges de l'écran se lisent sous un SafeAreaProvider propre à la modale */}
            <SafeAreaProvider>
                <ChoiceModalContent {...props} />
            </SafeAreaProvider>
        </Modal>
    );
}

function ChoiceModalContent<T>({ title, choices, selected, onSelect, onClose }: ContentProps<T>): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { languageHandler } = useContext(MainContext);
    // en bas : la marge de l'appareil (barre d'accueil) ou 20, pas les deux
    const { bottom } = useSafeAreaInsets();

    return (
        <SafeAreaView
            edges={['top', 'left', 'right']}
            style={[styles.container, { backgroundColor: getGrayBackgroundColour(isDarkMode) }]}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <ScrollView>
                    <View style={{ gap: 5 }}>
                        {choices.map((choice, index) => (
                            <Fragment key={choice.testID}>
                                <TouchableOpacity
                                    onPress={() => onSelect(choice.value)}
                                    testID={choice.testID}
                                    style={{
                                        backgroundColor: choice.value === selected ? getTopDarkColour(isDarkMode) : getGrayBackgroundColour(isDarkMode),
                                        borderRadius: 10
                                    }}
                                >
                                    <View style={[commonStyles.rowFlex, styles.row]}>
                                        <Text>{choice.label}</Text>
                                        <Icon name="chevron-right" size={20} color={getBlackColour(isDarkMode)} />
                                            </View>
                                        </TouchableOpacity>
                                        {index !== choices.length - 1 && <View style={[commonStyles.navSeparator]}></View>}
                                    </Fragment>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                    <View style={{ paddingHorizontal: 15, paddingBottom: Math.max(bottom, 20) }}>
                        <Button
                            testID='addBackButton'
                            text={languageHandler.getTranslation("back")}
                            onPress={onClose}
                        />
                    </View>
                </SafeAreaView>
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

export default ChoiceModal;
