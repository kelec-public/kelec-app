import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import commonStyles from '../../../lib/graphics/commonStyle';
import { useProfileController } from '../controllers/useProfileController';
import ProfileHeader from './ProfileHeader';
import CarRow from './CarRow';
import DefaultCarNotice from './DefaultCarNotice';

/** Onglet « Compte » : les voitures de l'utilisateur. */
function ProfileView(): React.JSX.Element {
    const theme = useTheme();
    const controller = useProfileController();
    const { cars } = controller;

    return (
        <View
            testID='profileView'
            style={[commonStyles.flex, { backgroundColor: theme.colors.background }]}
        >
            <SafeAreaView style={[commonStyles.flex]} edges={['top']}>
                <ProfileHeader
                    hasMultipleCars={controller.hasMultipleCars}
                    editMode={controller.editMode}
                    onToggleEditMode={controller.toggleEditMode}
                    onAddCar={controller.openAddCar}
                />
                <View style={commonStyles.navSeparator}></View>
                <View style={[commonStyles.flex, styles.mainWrapper, { backgroundColor: theme.colors.background }]}>
                    <ScrollView style={commonStyles.flex}>
                        {cars.map((car, index) => {
                            const vin = car.carModel.getVin();
                            return (
                                <CarRow
                                    key={vin}
                                    carModel={car.carModel}
                                    index={index}
                                    isLast={index === cars.length - 1}
                                    editMode={controller.editMode}
                                    isDefault={controller.isDefaultCar(vin)}
                                    onSelectDefault={() => controller.selectDefaultCar(vin)}
                                    onMove={direction => controller.moveCar(vin, direction)}
                                    onRename={name => controller.renameCar(vin, name)}
                                    onDelete={() => controller.confirmDelete(car)}
                                />
                            );
                        })}
                    </ScrollView>
                    {controller.defaultCarName !== null && (
                        <DefaultCarNotice carName={controller.defaultCarName} />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: {
        paddingTop: 15,
        flex: 1,
        paddingHorizontal: 15,
        gap: 10
    },
});

export default ProfileView;
