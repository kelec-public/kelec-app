import { StyleSheet, TouchableOpacity, View } from "react-native";
import { spacerL, spacerM, spacerS } from "./Spacers";
import { NEUTRAL_200, PRIMARY_COLOUR } from "../lib/colours";

type Props = {
    isSelected?: boolean;
    onPress?: () => void;
    testID?: string;
    children?: React.ReactNode;
};

const KelecCard = (props: Props) => {
    const { isSelected, onPress, testID, children } = props;
    const ViewComponent = onPress ? TouchableOpacity : View;
    return (
        <ViewComponent
            testID={testID}
            onPress={onPress}
            style={
                [
                    styles.kelecCard,
                    {
                        borderColor: isSelected ? PRIMARY_COLOUR : NEUTRAL_200,
                    }
                ]
            }
        >
            {onPress && isSelected !== undefined && (
                <View
                    style={
                        [
                            styles.thumb,
                            {
                                borderColor: isSelected ? PRIMARY_COLOUR : NEUTRAL_200,
                                backgroundColor: isSelected ? PRIMARY_COLOUR : 'transparent',
                            }
                        ]
                    }
                />
            )}
            {children}
        </ViewComponent>
    )
};

const styles = StyleSheet.create({
    kelecCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacerL,
        borderWidth: 1,
        borderColor: NEUTRAL_200,
        padding: spacerM,
        borderRadius: spacerS,
    },
    thumb: {
        width: spacerM,
        height: spacerM,
        borderRadius: spacerM,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: NEUTRAL_200,
    }
})

export default KelecCard;