import PagerView from "react-native-pager-view";
import { StyleSheet, View } from "react-native";
import { useContext, useRef } from "react";
import MainContext from "../../../lib/Contexts/MainContext";
import CarView from "./CarView/CarView";
import createNativeStackNavigator from '../../../lib/graphics/navigation';
import { NavigationContainer, NavigationIndependentTree, useTheme } from "@react-navigation/native";
import ChargesHistoryView from "../../../packages/kelec-charge-history/views/ChargesHistoryView";
import { ChargesHistoryProvider } from "../../../packages/kelec-charge-history/controllers/ChargesHistoryProvider";
import { CHARGES_HISTORY_ROUTE } from "../../../packages/kelec-charge-history/routes";
import { HvacProvider } from "../../../packages/kelec-hvac/controllers/HvacProvider";
import SendCoffeeCard from "./CarView/Elements/SendCoffee";
import { FullScreenMapView, MAP_ROUTE, MapProvider } from "../../../packages/kelec-map";
import { CAR_TYPE_ROUTE, CarTypeRouteParams, CarTypeScreen } from "../../../packages/kelec-car-type";
import { TFA_ROUTE, TfaRouteParams, TfaView } from "../../../packages/kelec-tfa";


export type CarsViewParamList = {
    [MAP_ROUTE]: undefined;
    DonationScreen: undefined;
    [CAR_TYPE_ROUTE]: CarTypeRouteParams;
    CarView: undefined;
    [CHARGES_HISTORY_ROUTE]: undefined;
    [TFA_ROUTE]: TfaRouteParams;
}

function CarsPageView(): React.JSX.Element {
    const { currentUser } = useContext(MainContext);
    const theme = useTheme()

    const Stack = createNativeStackNavigator<CarsViewParamList>();

    const ref = useRef<PagerView>(null);
    const tfaInProgress = useRef(false);

    return (
        <View style={styles.flex} testID="carsPageView">
            <PagerView ref={ref} style={styles.pagerView} initialPage={0} testID="pagerView" >
                {currentUser.getCars().map((account, index) => {
                    const carModel = account.getCar()!;
                    return (
                      <NavigationIndependentTree key={carModel.getVin()}>
                        <ChargesHistoryProvider carModel={carModel} account={account}>
                          <HvacProvider carModel={carModel} account={account}>
                            <MapProvider carModel={carModel} account={account}>
                              <NavigationContainer theme={theme}>
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
                                        tfaInProgress={tfaInProgress}
                                      />
                                    )}
                                  </Stack.Screen>
                                  <Stack.Screen name={TFA_ROUTE}>
                                    {props =>
                                      <TfaView {...props}
                                        onTfaCompleted={() => {
                                          tfaInProgress.current = false;
                                        }} />
                                    }
                                  </Stack.Screen>
                                  <Stack.Screen name={CHARGES_HISTORY_ROUTE}>
                                    {props => <ChargesHistoryView {...props} />}
                                  </Stack.Screen>
                                  <Stack.Screen name={CAR_TYPE_ROUTE}>
                                    {/* modèle enregistré : retour à la page voiture, qui recharge le profil en reprenant le focus */}
                                    {props => <CarTypeScreen {...props} onConfirmed={() => props.navigation.goBack()} />}
                                  </Stack.Screen>
                                  <Stack.Screen
                                    name="DonationScreen"
                                    options={{ presentation: 'modal' }}
                                  >
                                    {(props: any) => <SendCoffeeCard {...props} />}
                                  </Stack.Screen>
                                  <Stack.Screen
                                    name={MAP_ROUTE}
                                    options={{ presentation: 'modal' }}
                                  >
                                    {props => <FullScreenMapView {...props} />}
                                  </Stack.Screen>
                                </Stack.Navigator>
                              </NavigationContainer>
                            </MapProvider>
                          </HvacProvider>
                        </ChargesHistoryProvider>
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