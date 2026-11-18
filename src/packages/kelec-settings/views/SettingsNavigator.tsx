import createNativeStackNavigator from "../../../lib/graphics/navigation";
import { TARIFF_EDITOR_ROUTE, TARIFF_LIST_ROUTE, TariffEditorScreen, TariffListScreen } from "../../kelec-charge-cost";
import { SETTINGS_ROUTE, SettingsParamList } from "../routes";
import SettingsView from "./SettingsView";

const Stack = createNativeStackNavigator<SettingsParamList>();

/** Onglet « Réglages » : l'écran des réglages, et les pages poussées par-dessus (tarifs de l'électricité d'une voiture). */
function SettingsNavigator(): React.JSX.Element {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={SETTINGS_ROUTE} component={SettingsView} />
            <Stack.Screen name={TARIFF_LIST_ROUTE}>
                {({ navigation, route }) => (
                    <TariffListScreen
                        vin={route.params.vin}
                        onBack={() => navigation.goBack()}
                        onOpenTariff={tariffId => navigation.navigate(TARIFF_EDITOR_ROUTE, { vin: route.params.vin, tariffId })}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name={TARIFF_EDITOR_ROUTE}>
                {({ navigation, route }) => (
                    <TariffEditorScreen
                        vin={route.params.vin}
                        tariffId={route.params.tariffId}
                        onBack={() => navigation.goBack()}
                        onDone={() => navigation.goBack()}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

export default SettingsNavigator;
