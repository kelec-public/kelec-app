import { TARIFF_EDITOR_ROUTE, TARIFF_LIST_ROUTE, TariffEditorRouteParams, TariffListRouteParams } from "../kelec-charge-cost";

export const SETTINGS_ROUTE = 'SettingsView' as const;

export type SettingsParamList = {
    [SETTINGS_ROUTE]: undefined;
    [TARIFF_LIST_ROUTE]: TariffListRouteParams;
    [TARIFF_EDITOR_ROUTE]: TariffEditorRouteParams;
};
