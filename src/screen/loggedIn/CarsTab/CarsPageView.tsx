import PagerView from "react-native-pager-view";
import { StyleSheet, View } from "react-native";
import { useContext, useRef } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import CarView from "./CarView/CarView";
import createNativeStackNavigator from '../../../lib/graphics/navigation';
import { NavigationContainer, NavigationIndependentTree } from "@react-navigation/native";
import ChargesView from "./CarView/ChargesView.tsx/ChargesView";
import SendCoffeeCard from "./CarView/Elements/SendCoffee";
import FullScreenMapView from "./CarView/Elements/Map/FullScreenMapView";
import { WeatherApiHandler } from "../../../lib/clients/weather/weatherClient";
import CarModel from "../../../lib/clients/cars/carModel";
import CarModelSelector, { CarModelSelectorParamList } from "../../../packages/kelec-login/views/Steps/Step4/CarModelSelector";
import { SafeAreaView } from "react-native-safe-area-context";


export type CarsViewParamList = {
    MapView: {
        latitude: number;
        longitude: number;
        lastMapUpdateDate: Date;
        image: string;
        weatherHandler: WeatherApiHandler | undefined | null;
        carModel: CarModel;
    };
    DonationScreen: undefined;
    CarModelSelector: CarModelSelectorParamList;
    CarView: undefined;
    ChargesView: undefined;
}

function CarsPageView(): React.JSX.Element {
    const { currentUser } = useContext(MainContext);

    const Stack = createNativeStackNavigator<CarsViewParamList>();

    const ref = useRef<PagerView>(null);


    return (
        <View style={styles.flex} testID="carsPageView">
            <PagerView ref={ref} style={styles.pagerView} initialPage={0} testID="pagerView" >
                {currentUser.getCars().map((account, index) => {
                    const carModel = account.getCar()!;
                    return (
                      <NavigationIndependentTree key={carModel.getVin()}>
                        <NavigationContainer>
                          <Stack.Navigator
                            screenOptions={{
                              headerShown: false,
                            }}
                          >
                            <Stack.Screen name="CarView">
                              {props => (
                                <CarView
                                  {...props}
                                  carModel={carModel}
                                  account={account}
                                  pagerRef={ref}
                                />
                              )}
                            </Stack.Screen>
                            <Stack.Screen name="ChargesView">
                              {props => <ChargesView {...props} />}
                            </Stack.Screen>
                            <Stack.Screen name="CarModelSelector">
                              {props => {
                                return (
                                  <SafeAreaView
                                    edges={['top']}
                                    style={{ flex: 1 }}
                                  >
                                    <CarModelSelector {...props} />
                                  </SafeAreaView>
                                );
                              }}
                            </Stack.Screen>
                            <Stack.Screen
                              name="DonationScreen"
                              options={{ presentation: 'modal' }}
                            >
                              {(props: any) => <SendCoffeeCard {...props} />}
                            </Stack.Screen>
                            <Stack.Screen
                              name="MapView"
                              component={FullScreenMapView}
                              options={{ presentation: 'modal' }}
                            />
                          </Stack.Navigator>
                        </NavigationContainer>
                      </NavigationIndependentTree>
                    );
                })}

            </PagerView>
        </View>
    )
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    pagerView: {
        flex: 1,
    }
});

export default CarsPageView;