import { useState } from "react";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView, LayoutChangeEvent, Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { useTheme } from '@react-navigation/native';
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import Button from "./Button";
import { BLACK_COLOUR } from "../lib/colours";
import { subTitle, textBody, title1 } from "./Titles";
import { spacerL, spacerM, spacerS, spacerXXL } from "./Spacers";
import { CommonStyles } from "./Styles";

type Props = {
    testID?: string;
    /** Textes déjà traduits. */
    title: string;
    subtitle?: string;
    helpText?: string;
    children: React.ReactNode;
    /** Affiche une croix en haut à droite. */
    onDismiss?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    nextLabel?: string;
    isLightLoading?: boolean;
    disableNext?: boolean;
    nextButtonTestID?: string;
    safeAreaEdges?: Edge[];
};

/**
 * Écran d'étape (ajout de voiture, TFA, modèle de la voiture…) : titre, sous-titre, aide,
 * contenu défilant et boutons précédent / suivant fixés en bas.
 */
const StepLayout = ({ children, ...props }: Props) => {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();

    const { testID, title, subtitle, helpText, onDismiss, onNext, onPrevious, nextLabel, isLightLoading, disableNext, nextButtonTestID, safeAreaEdges } = props;

    const hasButtons = !!onNext || !!onPrevious;
    const [buttonContainerHeight, setButtonContainerHeight] = useState(0);

    const handleButtonContainerLayout = (event: LayoutChangeEvent) => {
        setButtonContainerHeight(event.nativeEvent.layout.height);
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
                <View style={[{ position: 'relative' }, CommonStyles.container]}>
                    <View style={[CommonStyles.container, CommonStyles.subView, CommonStyles.containerView]}>
                        {/* en haut : titre, fermeture, sous-titre */}
                        <View>
                            <View style={styles.topPart}>
                                <Text style={title1}>{title}</Text>
                                {onDismiss && (
                                    <TouchableOpacity testID="addBackButton" onPress={onDismiss}>
                                        <Icon name="close" size={spacerXXL} color={BLACK_COLOUR(isDarkMode)} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {subtitle && (
                                <Text style={subTitle} testID={testID ? `${testID}Subtitle` : undefined}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                        {helpText && <Text style={textBody}>{helpText}</Text>}

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
                    {/* en bas : précédent / suivant */}
                    <View onLayout={handleButtonContainerLayout} style={styles.bottom}>
                        <View style={styles.buttons}>
                            {onPrevious && (
                                <View>
                                    <Button
                                        testID={'previousButton'}
                                        buttonStyle={theme.buttons.neutral}
                                        icon="arrow-back"
                                        onPress={onPrevious}
                                        fillHeight
                                    />
                                </View>
                            )}
                            {onNext && (
                                <View style={{ flex: 1 }}>
                                    <Button
                                        testID={nextButtonTestID ?? "nextStepButton"}
                                        text={nextLabel}
                                        onPress={onNext}
                                        disabled={disableNext}
                                        isLoading={isLightLoading}
                                        fillHeight
                                    />
                                </View>
                            )}
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
    },
    bottom: {
        position: 'absolute',
        bottom: 0,
        flex: 1,
        width: '100%',
    },
    buttons: {
        gap: spacerS,
        flexDirection: 'row',
        paddingVertical: spacerL,
        alignItems: 'stretch',
        paddingHorizontal: spacerL,
    },
});

export default StepLayout;
