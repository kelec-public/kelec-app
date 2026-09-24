import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  NavigationContainer,
  NavigationIndependentTree, useTheme,
} from '@react-navigation/native';
import CarMakerSelectView from "./Steps/Step1/CarMakerSelectView";
import Account from "../../../lib/clients/accounts/account";
import CredentialsView from "./Steps/Step2/CredentialsView";
import SelectACarView from "./Steps/Step3/SelectACarView";
import { useColorScheme, View } from "react-native";
import { CAR_TYPE_ROUTE, CarTypeRouteParams, CarTypeScreen } from "../../kelec-car-type";
import { TFA_ROUTE, TfaRouteParams, TfaView } from "../../kelec-tfa";
import { Palette } from "../../../../theme/_palette";
import { useAddCarFlow } from "../controllers/useAddCarFlow";

export type LoginEntryParamList = {
  CarMakerSelectView: undefined;
  CredentialsView: undefined;
  SelectACarView: {
    account: Account;
  }
  [TFA_ROUTE]: TfaRouteParams;
  CarModelChoiceStep: {
    vin: string;
  };
  [CAR_TYPE_ROUTE]: CarTypeRouteParams;
}

const LoginEntryView = () => {
  const Stack = createNativeStackNavigator<LoginEntryParamList>();

  // this navigator should be background white
  const theme = useTheme();
  const isDarkMode = useColorScheme() === 'dark';
  const loginNavigationTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      background: isDarkMode ? Palette.black : Palette.white,
    },
  };


  const flow = useAddCarFlow();

  return (
    <View testID="loginView" style={{ flex: 1 }}>
      <NavigationIndependentTree>
        <NavigationContainer theme={loginNavigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="CarMakerSelectView">
              {props => (
                <CarMakerSelectView
                  selectedCarMaker={flow.carMaker}
                  setSelectedCarMaker={flow.setCarMaker}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CredentialsView">
              {props =>
                flow.carMaker ? (
                  <CredentialsView
                    selectedCarMaker={flow.carMaker}
                    setAccount={flow.setAccount}
                    {...props}
                  />
                ) : null
              }
            </Stack.Screen>
            <Stack.Screen name={TFA_ROUTE}>
              {props =>
                flow.carMaker ? <TfaView {...props} /> : null
              }
            </Stack.Screen>
            <Stack.Screen name="SelectACarView">
              {props => (
                <SelectACarView
                  selectedCar={flow.selectedCar}
                  setSelectedCar={flow.setSelectedCar}
                  {...props}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name={CAR_TYPE_ROUTE}>
              {/* dernière étape : le modèle enregistré, on ajoute la voiture au compte */}
              {props => <CarTypeScreen {...props} onConfirmed={flow.confirm} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </View>
  );
};

export default LoginEntryView;