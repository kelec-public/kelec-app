import { StyleSheet, Switch, TouchableWithoutFeedback, useColorScheme, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Text from "../../../screen/Common/CustomText";
import KelecCard from "./Card";
import SpacedRow from "./SpacedRow";
import { CommonStyles } from "./Styles";
import { spacerL, spacerM, spacerXL } from "./Spacers";
import { BLACK_COLOUR, PRIMARY_COLOUR } from "../lib/colours";
import { textBody } from "./Titles";

type Props = {
    /** testID de la zone cliquable (toute la ligne bascule l'interrupteur). */
    readonly testID?: string;
    readonly icon: string;
    /** Libellé déjà traduit. */
    readonly label: string;
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
    /** Contenu affiché sous la ligne (ex. champs visibles seulement quand l'option est activée). */
    readonly children?: React.ReactNode;
};

/** Carte avec une option on/off : icône, libellé, interrupteur. */
const SwitchCard = ({ testID, icon, label, value, onValueChange, children }: Props) => {
    const isDarkMode = useColorScheme() === 'dark';
    const toggle = () => onValueChange(!value);

    return (
        <KelecCard>
            <View style={[CommonStyles.container, styles.content]}>
                <SpacedRow>
                    <TouchableWithoutFeedback testID={testID} onPress={toggle}>
                        <View style={styles.row}>
                            <View style={styles.labelRow}>
                                <Icon name={icon} size={spacerXL} color={BLACK_COLOUR(isDarkMode)} />
                                <Text style={[textBody, styles.label]}>{label}</Text>
                            </View>
                            <Switch value={value} onValueChange={toggle} trackColor={{ true: PRIMARY_COLOUR }} />
                        </View>
                    </TouchableWithoutFeedback>
                </SpacedRow>
                {children}
            </View>
        </KelecCard>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacerM,
        gap: spacerL,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
    labelRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerM,
    },
    label: {
        flexShrink: 1,
        flexWrap: 'wrap',
    },
});

export default SwitchCard;
