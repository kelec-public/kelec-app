import { Modal, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import commonStyles from "../../../lib/graphics/commonStyle";
import { getBlackColour, getGrayBackgroundColour } from "../../../lib/graphics/utils";
import Text from "../CustomText";
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
    title: string;
    testID: string;
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const BottomSheet = (props: Props) => {
    const { title, children, visible, onClose, testID } = props;

    const isDarkMode = useColorScheme() === 'dark';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            testID={testID}
        >
            <SafeAreaProvider>
                <View style={[commonStyles.flex, commonStyles.flexEnd]}>
                    <SafeAreaView
                        style={
                            [
                                {
                                    backgroundColor: getGrayBackgroundColour(isDarkMode),
                                },
                                styles.mainView,
                            ]}
                        edges={['bottom']}
                    >
                        <View style={styles.mainViewContent}>
                            <View style={[commonStyles.rowFlex, { justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={commonStyles.bottomSheetTitle}>{title}</Text>
                                <Icon
                                    testID={testID + "CloseButton"}
                                    name="close"
                                    size={30}
                                    onPress={onClose}
                                    color={getBlackColour(isDarkMode)}
                                />
                            </View>
                            {children}
                        </View>
                    </SafeAreaView>
                </View>
            </SafeAreaProvider>
        </Modal>
    )
};

const styles = StyleSheet.create({
    mainView: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 1,
        shadowRadius: 16.00,
        elevation: 24,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: 10,
    },
    mainViewContent: {
        paddingHorizontal: 15,
        paddingTop: 15,
    },
})

export default BottomSheet;