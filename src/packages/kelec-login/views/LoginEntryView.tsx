import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import CarMakerSelectView from "./Steps/Step1/CarMakerSelectView";
import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import { useContext, useState } from "react";
import CredentialsView from "./Steps/Step2/CredentialsView";
import SelectACarView from "./Steps/Step3/SelectACarView";
import CarModel from "../../../lib/clients/cars/carModel";
import MainContext from "../../../lib/Contexts/MainContext";
import { View } from "react-native";
import CarModelSelector, { CarModelSelectorParamList } from "./Steps/Step4/CarModelSelector";

export type LoginEntryParamList = {
    CarMakerSelectView: undefined;
    CredentialsView: undefined;
    SelectACarView: {
        account: Account;
    }
    CarModelChoiceStep: {
        vin: string;
    };
    CarModelSelector: CarModelSelectorParamList;
}

const LoginEntryView = () => {
    const { currentUser, storageHandler, reloadUser } = useContext(MainContext);

    const Stack = createNativeStackNavigator<LoginEntryParamList>();


    // data for account creation
    const [selectedCarMaker, setSelectedCarMaker] = useState<CarMaker | undefined>(undefined);
    const [account, setAccount] = useState<Account | undefined>(undefined);
    const [selectedCar, setSelectedCar] = useState<CarModel | undefined>(undefined);

    // triggered when user has selected car model
    const onConfirmCarAdd = async () => {
        account?.setCar(selectedCar!);
        currentUser.addCar(account!);
        await storageHandler.saveAccount(currentUser);
        reloadUser();
    };

    return (
      <View testID="loginView" style={{ flex: 1 }}>
        <NavigationIndependentTree>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="CarMakerSelectView">
                {props => (
                  <CarMakerSelectView
                    selectedCarMaker={selectedCarMaker}
                    setSelectedCarMaker={setSelectedCarMaker}
                    {...props}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="CredentialsView">
                {props =>
                  selectedCarMaker ? (
                    <CredentialsView
                      selectedCarMaker={selectedCarMaker}
                      setAccount={setAccount}
                      {...props}
                    />
                  ) : null
                }
              </Stack.Screen>
              <Stack.Screen name="SelectACarView">
                {props => (
                  <SelectACarView
                    selectedCar={selectedCar}
                    setSelectedCar={setSelectedCar}
                    onConfirmCarAdd={onConfirmCarAdd}
                    {...props}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="CarModelSelector">
                {props => <CarModelSelector {...props} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>
      </View>
    );
};

export default LoginEntryView;