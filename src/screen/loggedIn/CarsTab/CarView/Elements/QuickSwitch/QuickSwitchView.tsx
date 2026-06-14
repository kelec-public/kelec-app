import { View } from "react-native";
import commonStyles from "../../../../../../lib/graphics/commonStyle";
import Account from "../../../../../../lib/clients/accounts/account";
import QuickSwitchElementView from "./QuickSwitchElementView";


type Props = {
    cars: Account[];
    onClose: () => void;
    pagerRef: any;
};

const QuickSwitchView = (props: Props) => {
    const { cars, onClose, pagerRef } = props;

    const displayCarsAvailable = () => {
        return cars.map((car, index) => {
            return (
                <QuickSwitchElementView
                    key={`carChoice${car.car?.getVin()}`}
                    car={car}
                    onSelect={() => {
                        pagerRef.current?.setPage(index);
                        onClose();
                    }}
                    isLast={index === cars.length - 1}
                />
            )
        })
    };

    return (
        <View style={[commonStyles.gap15, commonStyles.marginVertical]}>
            <View>
                {displayCarsAvailable()}
            </View>
        </View>
    )
};

export default QuickSwitchView;