import CarType, { AUTHORISED_MODELS, CarAvailableModels, LeasingData } from "../../../lib/clients/cars/carTypes/carType";
import { BatteryApi, BrandApi, ModelApi } from "../../../lib/clients/kelec-api/kelecApiHandler";
import { DropDownData } from "../../../screen/Common/DropDown";

/** Saisie du formulaire « modèle de la voiture ». */
export type CarTypeForm = {
    brand: DropDownData | null;
    model: DropDownData | null;
    battery: DropDownData | null;
    chargingLimit: number;
    /** undefined : pas de leasing. */
    leasing: LeasingData | undefined;
    supportsV2G: boolean;
};

export const EMPTY_CAR_TYPE_FORM: CarTypeForm = {
    brand: null,
    model: null,
    battery: null,
    chargingLimit: 100,
    leasing: undefined,
    supportsV2G: false,
};

/* ------------------------- options des menus déroulants ------------------------- */

export const formatBatteryLabel = (battery: BatteryApi): string => {
    let label = `${battery.size} kWh / AC ${battery.max_ac_power} kW`;
    if (battery.max_dc_power > 0) {
        label += ` / DC ${battery.max_dc_power} kW`;
    }
    return label;
};

export const brandOption = (brand: BrandApi): DropDownData => ({
    testID: brand.name + 'TestId',
    label: brand.display_name,
    value: brand.name,
    apiData: brand,
});

export const modelOption = (model: ModelApi): DropDownData => ({
    testID: model.name + 'TestId',
    label: model.display_name,
    value: model.name,
    additionalProp: model.engine_type,
    apiData: model,
});

export const batteryOption = (battery: BatteryApi, index: number): DropDownData => ({
    testID: `${battery.size}-${battery.max_ac_power}-${battery.max_dc_power}-TestId`,
    label: formatBatteryLabel(battery),
    value: index,
    apiData: battery,
});

/* ----------------------------------- règles ----------------------------------- */

/** Marque, modèle et batterie obligatoires ; si leasing, ses dates et son kilométrage aussi. */
export const isCarTypeFormValid = (form: CarTypeForm): boolean => {
    if (form.brand == null || form.model == null || form.battery == null) return false;
    if (form.leasing && (form.leasing.startDate == null || form.leasing.endDate == null || form.leasing.totalMileage == null)) {
        return false;
    }
    return true;
};

/** La limite de charge n'est proposée que pour les modèles qui la gèrent. */
export const supportsChargingLimit = (form: CarTypeForm): boolean =>
    form.battery !== null && AUTHORISED_MODELS.includes(form.model?.value as CarAvailableModels);

/* --------------------------------- conversions --------------------------------- */

export const formFromCarType = (carType: CarType): CarTypeForm => ({
    brand: brandOption(carType.getBrand()),
    model: modelOption(carType.getCarModel()),
    // l'index n'est pas conservé : 0 suffit, la batterie est retrouvée par ses caractéristiques
    battery: batteryOption({
        size: carType.getBatterySize(),
        max_ac_power: carType.getMaxAcCharging(),
        max_dc_power: carType.getMaxDcCharging(),
    }, 0),
    chargingLimit: carType.getChargingLimit(),
    leasing: carType.getLeasingData(),
    supportsV2G: carType.getSupportsV2G(),
});

/** À n'appeler que sur un formulaire valide. */
export const carTypeFromForm = (form: CarTypeForm): CarType => new CarType({
    brand: form.brand?.apiData as BrandApi,
    model: form.model?.apiData as ModelApi,
    battery: form.battery?.apiData as BatteryApi,
    chargingLimit: form.chargingLimit,
    leasing: form.leasing,
    supportsV2G: form.supportsV2G,
});

