import { useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import PagerView from 'react-native-pager-view';
import CarModel from '../../../lib/clients/cars/carModel';
import MainContext from '../../../lib/Contexts/MainContext';
import CarsViewContext from '../../../lib/Contexts/CarsViewContext';
import commonStyles from '../../../lib/graphics/commonStyle';
import Text from '../../../screen/Common/CustomText';
import { getBlackColour, getDisplayDate } from '../../../lib/graphics/utils';
import BottomSheet from '../../../screen/Common/bottomSheet/BottomSheet';
import QuickSwitchView from '../../../screen/loggedIn/CarsTab/CarView/Elements/QuickSwitch/QuickSwitchView';

const NEVER_UPDATED_YEAR = new Date(0).getFullYear();

type Props = {
    carModel: CarModel;
    lastUpdateDate: Date;
    pagerRef: React.RefObject<PagerView | null>;
    onOpenDonation: () => void;
};

function CarViewHeader({ carModel, lastUpdateDate, pagerRef, onOpenDonation }: Readonly<Props>): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';
    const { currentUser, languageHandler } = useContext(MainContext);
    const { handleModalAnim } = useContext(CarsViewContext);

    const [isCarChoiceVisible, setIsCarChoiceVisible] = useState<boolean>(false);

    const cars = currentUser.getCars();
    const hasBeenUpdated = lastUpdateDate.getFullYear() !== NEVER_UPDATED_YEAR;

    const openCarChoice = () => {
        setIsCarChoiceVisible(true);
        handleModalAnim(true);
    };

    const closeCarChoice = () => {
        setIsCarChoiceVisible(false);
        handleModalAnim(false);
    };

    return (
        <View style={[commonStyles.spaceBetween, commonStyles.rowFlex, styles.header]}>
            <TouchableOpacity onPress={openCarChoice} testID="carChoiceButton">
                <View style={styles.titleRow}>
                    <View style={styles.titleColumn}>
                        <Text style={commonStyles.navTitle} testID="carViewTitle">
                            {carModel.getModel()}
                        </Text>
                        {hasBeenUpdated && (
                            <Text testID="lastUpdateText" style={styles.lastUpdateText}>
                                {languageHandler.getTranslation('lastUpdated')}
                                {getDisplayDate(lastUpdateDate)}
                            </Text>
                        )}
                    </View>

                    {cars.length > 1 && (
                        <Icon
                            testID={`carChoiceIcon${carModel.getVin()}`}
                            name="keyboard-arrow-down"
                            size={25}
                            color={getBlackColour(isDarkMode)}
                            style={styles.chevron}
                        />
                    )}

                    <BottomSheet
                        testID="carChoiceModal"
                        title={languageHandler.getTranslation('your_cars')}
                        visible={isCarChoiceVisible}
                        onClose={closeCarChoice}
                    >
                        <QuickSwitchView cars={cars} onClose={closeCarChoice} pagerRef={pagerRef} />
                    </BottomSheet>
                </View>
            </TouchableOpacity>

            <TouchableOpacity testID="openCoffeeModal" onPress={onOpenDonation}>
                <MaterialIcon name="coffee-outline" size={25} color={getBlackColour(isDarkMode)} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 15,
        marginVertical: 10,
        flexWrap: 'wrap',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleColumn: {
        alignItems: 'flex-start',
    },
    chevron: {
        marginLeft: 10,
    },
    lastUpdateText: {
        color: 'gray',
    },
});

export default CarViewHeader;