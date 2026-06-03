import React, { useContext, useMemo, useRef, useState } from 'react';
import { Animated, View, useColorScheme, StyleSheet } from 'react-native';
import MainContext from '../../../lib/Contexts/MainContext';
import CarsPageView from './CarsPageView';
import CarsViewContext from '../../../lib/Contexts/CarsViewContext';
import Text from '../../Common/CustomText';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

function CarsView(): React.JSX.Element {

    // get current user
    const { currentUser } = useContext(MainContext);


    // to show an overlay when a modal is open
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const darkOverlayOpacity = useRef(new Animated.Value(0)).current;

    const getCurrentView = () => {
        if (currentUser.getCars().length == 0) {
            return (
                <SafeAreaView>
                    <Text>No car</Text>
                </SafeAreaView>
            )
        } else {
            return <CarsPageView />;
        }
    };

    const handleModalAnim = (open: boolean) => {
        if (open) {
            setIsModalOpen(true);
            Animated.timing(darkOverlayOpacity, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(darkOverlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start(() => {
                setIsModalOpen(false);
            });
        }

    }

    const carsViewContextValues = useMemo(() => ({
        handleModalAnim
    }), []);


    return (
        <CarsViewContext.Provider value={carsViewContextValues}>
            <View testID='carsView' style={styles.container}>
                <View style={[styles.flex, styles.fullWidth, { backgroundColor: useTheme().colors.background }]}>
                    {getCurrentView()}
                </View>
                {/* overlay when modal is open */}
                {isModalOpen && (
                    <Animated.View style={{ width: '100%', height: '100%', backgroundColor: 'rgb(50,50,50)', position: 'absolute', zIndex: 1, opacity: darkOverlayOpacity }} />
                )}
            </View >
        </CarsViewContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flex: {
        flex: 1
    },
    fullWidth: {
        width: '100%'
    }
});
export default CarsView;