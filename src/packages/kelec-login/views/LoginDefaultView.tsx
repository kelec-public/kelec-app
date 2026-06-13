import { useContext } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import Button from "../../kelec-model/view/Button";
import { BLACK_COLOUR, NEUTRAL_ZERO, PRIMARY_COLOUR, WHITE_COLOUR } from "../../kelec-model/lib/colours";
import Text from "../../../screen/Common/CustomText";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ViewsAvailable } from "../../../Main";
import { subTitle, textBody, title1 } from "../../kelec-model/view/Titles";
import { spacerM, spacerS, spacerXXL } from "../../kelec-model/view/Spacers";
import { CommonStyles } from "../../kelec-model/view/Styles";

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
};

const LoginDefaultView = ({ children, ...props }: Props) => {
    const { languageHandler, setCurrentView } = useContext(MainContext);
    const isDarkMode = useColorScheme() === 'dark';

    const { testID, title, subtitle, onNext, onPrevious, isLightLoading, disableNext, shouldDisplayDismissButton, helpText, nextButtonTestID, nextButtonText, backButtonText } = props;

    return (
        <SafeAreaView
            style={
                [
                    {
                        backgroundColor: WHITE_COLOUR(isDarkMode)
                    },
                    CommonStyles.container
                ]
            }
            testID={testID}
        >
            <View
                style={CommonStyles.containerView}
            >
                <View
                    style={
                        [
                            CommonStyles.container,
                            CommonStyles.subView
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
                                    testID='addBackButton'
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
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        {children}
                    </ScrollView>
                </View>
                {/* the bottom buttons */}
                <View
                    style={{
                        gap: spacerS,
                        flexDirection: 'row',
                        paddingTop: spacerM,
                        alignItems: 'stretch',
                    }}
                >
                    {onPrevious && (
                        <View
                            style={{
                                flex: 1,
                            }}
                        >
                            <Button
                                testID={'previousButton'}
                                colour={NEUTRAL_ZERO}
                                text={languageHandler.getTranslation(backButtonText ?? "backToPreviousStep")}
                                iconName="arrow-back"
                                onPress={onPrevious}
                            />
                        </View>
                    )}

                    {onNext && (
                        <View
                            style={{
                                flex: 2,
                            }}
                        >
                            <Button
                                testID={nextButtonTestID ?? 'nextStepButton'}
                                colour={PRIMARY_COLOUR}
                                text={languageHandler.getTranslation(nextButtonText ?? "next")}
                                onPress={onNext}
                                disabled={disableNext}
                                isLoading={isLightLoading}
                            />
                        </View>
                    )}

                </View>
            </View>
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