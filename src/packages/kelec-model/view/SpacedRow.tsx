import { View } from "react-native";
import { spacerL } from "./Spacers";

type Props = {
    readonly children: React.ReactNode;
};

/** Ligne : éléments aux deux extrémités, centrés verticalement. */
const SpacedRow = ({ children }: Props) => (
    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'space-between', gap: spacerL }}>
        {children}
    </View>
);

export default SpacedRow;
