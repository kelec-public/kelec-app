import { useContext, useState } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, LayoutChangeEvent, Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Button from "../../kelec-model/view/Button";
import { BLACK_COLOUR } from "../../kelec-model/lib/colours";
import Text from "../../../screen/Common/CustomText";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ViewsAvailable } from "../../../Main";
import { subTitle, textBody, title1 } from "../../kelec-model/view/Titles";
import { spacerL, spacerM, spacerS, spacerXXL } from "../../kelec-model/view/Spacers";
import { CommonStyles } from "../../kelec-model/view/Styles";
import { useTheme } from '@react-navigation/native';

type Props = {
    testID?: string;
    shouldDisplayDismissButton?: boolean;
    title: string;
    subtitle?: string;
    helpText?: string;
    children: React.ReactNode;
    onNext?: () => void;
    onPrevious?: () => void;
    isLightLoading?: boolean;
    disableNext?: boolean;
    nextButtonTestID?: string;
    nextButtonText?: string;
    backButtonText?: string;
    safeAreaEdges?: Edge[];
};

const LoginDefaultView = ({ children, ...props }: Props) => {
    const { languageHandler, setCurrentView } = useContext(MainContext);
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();

    const { testID, title, subtitle, onNext, onPrevious, isLightLoading, disableNext, shouldDisplayDismissButton, helpText, nextButtonTestID, nextButtonText, backButtonText, safeAreaEdges } = props;

    const hasButtons = !!onNext || !!onPrevious;
    const [buttonContainerHeight, setButtonContainerHeight] = useState(0);

    const handleButtonContainerLayout = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setButtonContainerHeight(height);
    };

    return (
        <SafeAreaView
            edges={safeAreaEdges}
            style={CommonStyles.container}
            testID={testID}
        >
            <KeyboardAvoidingView
                style={CommonStyles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <View
                style={
                    [
                        {
                            position: 'relative'
                        },
                        CommonStyles.container

                    ]
                }
            >
                <View
                    style={
                        [
                            CommonStyles.container,
                            CommonStyles.subView,
                            CommonStyles.containerView,
                        ]
                    }
                >
                    {/* top part */}
                    <View>
                        <View
                            style={styles.topPart}
                        >
                            <Text style={title1}>
                                {languageHandler.getTranslation(title)}
                            </Text>
                            {shouldDisplayDismissButton && (
                                <TouchableOpacity
                                    testID="addBackButton"
                                    onPress={() => {
                                        setCurrentView(ViewsAvailable.LOGGEDIN);
                                    }}>
                                    <Icon
                                        name="close"
                                        size={spacerXXL}
                                        color={BLACK_COLOUR(isDarkMode)}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                        {subtitle && (
                            <Text
                                style={subTitle}
                                testID={testID ? `${testID}Subtitle` : undefined}
                            >
                                {languageHandler.getTranslation(subtitle)}
                            </Text>
                        )}
                    </View>
                    {/* the help text part */}
                    {helpText && (
                        <Text
                            style={textBody}
                        >
                            {languageHandler.getTranslation(helpText)}
                        </Text>
                    )}

                    {/* the child view */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingBottom: hasButtons ? buttonContainerHeight : spacerM,
                        }}
                    >
                        {children}
                    </ScrollView>
                </View>
                {/* the bottom buttons */}
                <View
                    onLayout={handleButtonContainerLayout}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        flex: 1,
                        width: '100%',
                    }}
                >
                    <View
                        style={{
                            position: 'relative',
                            }}>
                        <View
                            style={{
                                gap: spacerS,
                                flexDirection: 'row',
                                paddingVertical: spacerL,
                                alignItems: 'stretch',
                                paddingHorizontal: spacerL,
                            }}>
                            {onPrevious && (
                                <View>
                                    <Button
                                        testID={'previousButton'}
                                        buttonStyle={theme.buttons.neutral}
                                        icon="arrow-back"
                                        onPress={onPrevious}
                                    />
                                </View>
                            )}

                            {onNext && (
                                <View
                                    style={{
                                        flex: 1
                                    }}>
                                    <Button
                                        testID={nextButtonTestID ?? "nextStepButton"}
                                        text={languageHandler.getTranslation(nextButtonText ?? "next")}
                                        onPress={onNext}
                                        disabled={disableNext}
                                        isLoading={isLightLoading}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    topPart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
});

export default LoginDefaultView;