import { View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

type InfoPopupProps = {
    readonly backgroundColour: string;
    readonly icon: string;
    readonly iconColour: string;
    readonly children: React.JSX.Element | React.JSX.Element[];
    readonly testID?: string;
}

function InfoPopup({ backgroundColour, icon, iconColour, children, testID }: InfoPopupProps): React.JSX.Element {
    return (
        <View
            testID={testID}
            style={{
                backgroundColor: backgroundColour,
                padding: 10,
                borderRadius: 10
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%'
                }}
            >
                <Icon name={icon} size={20} color={iconColour} />
                <View style={{ flex: 1 }}>
                    {children}
                </View>
            </View>
        </View>
    )
}

export default InfoPopup;