import React, { ComponentRef, useRef, useState, useEffect } from "react";
import { Image, Dimensions, ScrollView, StyleSheet, TouchableWithoutFeedback, useColorScheme, View, Modal, TouchableOpacity, Animated } from "react-native";
import Text from "./CustomText";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getBlackColour, getCarMakerLogo, getGrayBackgroundColour } from "../../lib/graphics/utils";
import { CarMaker } from "../../lib/clients/accounts/account";
import { BatteryApi, BrandApi, ModelApi } from "../../lib/clients/kelec-api/kelecApiHandler";
import KelecCard from "../../packages/kelec-model/view/Card";
import { NEUTRAL_200 } from "../../packages/kelec-model/lib/colours";
import { spacerS, spacerXL, spacerXXL } from "../../packages/kelec-model/view/Spacers";
import { CommonStyles } from "../../packages/kelec-model/view/Styles";
import { textBody } from "../../packages/kelec-model/view/Titles";

interface DropDownData {
    testID: string;
    label: string;
    value: string | number;
    additionalProp?: string; // to store for example the engine 
    apiData: BrandApi | ModelApi | BatteryApi;
};

enum DropDownType {
    BRAND = 'brand',
    MODEL = 'model',
    BATTERY = 'battery',
};

type CustomDropDownProps = {
    backgroundColor?: string;
    testID: string;
    placeholder: string;
    onChange: (item: DropDownData) => void;
    data: DropDownData[];
    value: DropDownData | null;
    dropDownType: DropDownType;
}

const CustomDropDown = ({ backgroundColor, testID, placeholder, onChange, data, value, dropDownType }: CustomDropDownProps): React.JSX.Element => {
    const [isFocus, setIsFocus] = useState(false);
    const dropdownRef = useRef<ComponentRef<typeof View>>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const isDarkMode = useColorScheme() === 'dark';

    const [selectedItem, setSelectedItem] = useState<DropDownData | null>(null);

    useEffect(() => {
        if (isFocus) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.95);
        }
    }, [isFocus]);

    const generateChoiceList = (): React.JSX.Element => {
        const choices = data.map((item: DropDownData) => {
            return (
                <TouchableOpacity
                    testID={item.testID}
                    onPress={() => {
                        onChange(item);
                        setSelectedItem(item);
                        setIsFocus(false);
                    }}
                    key={item.value}
                    style={[styles.choiceItem, {
                        borderBottomWidth: data.indexOf(item) === data.length - 1 ? 0 : 0.5,
                        borderBottomColor: NEUTRAL_200,
                    }]}
                >
                    {dropDownType === DropDownType.BRAND && (
                        <Image style={styles.logo} source={getCarMakerLogo(item.value as CarMaker, isDarkMode)} />
                    )}
                    {dropDownType === DropDownType.MODEL && item.additionalProp === 'ELEC' && (
                        <Icon name="ev-plug-ccs2" size={spacerXL} color={getBlackColour(isDarkMode)} />
                    )}
                    {dropDownType === DropDownType.MODEL && item.additionalProp === 'PHEV' && (
                        <View style={styles.iconContainer}>
                            <Icon name="ev-plug-type2" size={20} color={getBlackColour(isDarkMode)} />
                            <Icon name="gas-station" size={20} color={getBlackColour(isDarkMode)} />
                        </View>
                    )}
                    <Text style={styles.choiceText}>{item.label}</Text>
                </TouchableOpacity>
            )
        });
        return (
            <View style={[styles.choiceWrapper, { backgroundColor: backgroundColor ?? getGrayBackgroundColour(isDarkMode) }]}>
                <ScrollView>
                    {choices}
                </ScrollView>
            </View>
        )
    }

    return (
        <>
            <KelecCard
                isSelected={isFocus}
            >
                <View
                    style={
                        [
                            CommonStyles.container,
                            {
                                zIndex: isFocus ? 1001 : 0,
                            },
                        ]
                    }
                    ref={dropdownRef}
                >
                    <TouchableWithoutFeedback
                        onPress={() => {
                            setIsFocus(!isFocus);
                        }}
                        testID={testID}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                {value && dropDownType === DropDownType.BRAND && (
                                    <Image style={styles.selectedLogo} source={getCarMakerLogo(value.value as CarMaker, isDarkMode)} />
                                )}
                                {dropDownType === DropDownType.MODEL && selectedItem?.additionalProp === 'ELEC' && value && (
                                    <View style={styles.iconSmallContainer}>
                                        <Icon name="ev-plug-ccs2" size={spacerXL} color={getBlackColour(isDarkMode)} />
                                    </View>
                                )}
                                {dropDownType === DropDownType.MODEL && selectedItem?.additionalProp === 'PHEV' && value && (
                                    <View style={styles.iconSmallContainer}>
                                        <Icon name="ev-plug-type2" size={spacerXL} color={getBlackColour(isDarkMode)} />
                                        <Icon name="gas-station" size={spacerXL} color={getBlackColour(isDarkMode)} />
                                    </View>
                                )}
                                <Text
                                    style={
                                        [
                                            textBody,
                                            {
                                                opacity: value ? 1 : 0.6,
                                            }

                                        ]
                                    }
                                    testID={testID + '-label'}
                                >
                                    {value ? value.label : placeholder}
                                </Text>
                            </View>
                            <Icon
                                name={isFocus ? "chevron-up" : "chevron-down"}
                                size={spacerXL}
                                color={getBlackColour(isDarkMode)}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </KelecCard>

            <Modal
                visible={isFocus}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setIsFocus(false);
                }}
            >
                <TouchableWithoutFeedback
                    onPress={() => {
                        setIsFocus(false);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <Animated.View
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: backgroundColor ?? getGrayBackgroundColour(isDarkMode),
                                    opacity: fadeAnim,
                                    transform: [{ scale: scaleAnim }]
                                }
                            ]}
                        >
                            {generateChoiceList()}
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    )
};

const styles = StyleSheet.create({

    selectedLogo: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        marginRight: 10,
    },
    iconContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 0,
        width: spacerXXL,
        justifyContent: 'center',
    },
    iconSmallContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 0,
        marginRight: 10,
        justifyContent: 'center',
    },
    choiceWrapper: {
        maxHeight: Dimensions.get('window').height * 0.8,
        backgroundColor: 'white',
        width: '100%',
        flexShrink: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    choiceItem: {
        padding: 15,
        paddingVertical: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    choiceText: {
        fontSize: 16,
    },
    logo: {
        width: 25,
        height: 25,
        resizeMode: 'contain',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        borderRadius: spacerS,
        padding: spacerS,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});

export default CustomDropDown;
export type { DropDownData };
export { DropDownType }