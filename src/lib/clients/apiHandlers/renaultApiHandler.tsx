import AppPreferences from "../../appPreferences/model/appPreferences";
import { getDistance } from "../../graphics/utils";
import { BatteryStatus, ChargeSettingsStatus, CockpitStatus, HVACStatus, MapLocationStatus, RenaultStatus } from "../carMakers/renaultClient";
import { HVACStatusEnum } from "../carMakers/renaultEnums";
import CarType, { CarAvailableModels } from "../cars/carTypes/carType";
import ApiHandler from "./apiHandler";
import RenaultChargesHandler from "./renaultChargesHandler";

class RenaultApiHandler implements ApiHandler {
    private apiBatteryStatusRenault?: {
        hasError: boolean;
        apiData?: BatteryStatus;
    };
    private apiCockpitRenault?: {
        hasError: boolean;
        apiData?: CockpitStatus;
    };
    private apiLocationStatus?: {
        hasError: boolean;
        apiData?: MapLocationStatus;
    }
    private apiChargesSettings?: {
        hasError: boolean;
        apiData?: ChargeSettingsStatus;
    }
    private apiHVACStatus?: {
        hasError: boolean;
        apiData?: HVACStatus;
    }

    // initial charge hisotry handler with error
    private apiChargesHistory: RenaultChargesHandler = new RenaultChargesHandler([], true);
    constructor(batteryStatus?: RenaultStatus) {
        this.apiBatteryStatusRenault = batteryStatus;

    }


    getBatteryLevel(): number {
        return this.apiBatteryStatusRenault?.apiData?.batteryLevel ?? 0;
    }

    getCarRange(appPreferences: AppPreferences): number {
        let range = this.apiBatteryStatusRenault?.apiData?.batteryAutonomy ?? 0;
        return getDistance(range, appPreferences, true);
    }

    getCarMileage(appPreferences: AppPreferences): number {
        let range = this.apiCockpitRenault?.apiData?.totalMileage ?? 0;
        return getDistance(range, appPreferences);
    }

    setApiData(apiData: RenaultStatus): void {
        this.apiBatteryStatusRenault = apiData;
    }

    setCockpitStatus(cockpitStatus: RenaultStatus): void {
        this.apiCockpitRenault = cockpitStatus;
    }

    getLastUpdateDate(): Date {
        return new Date(this.apiBatteryStatusRenault?.apiData?.timestamp ?? 0);
    }

    getChargingPower(carType: CarType): number {
        if (carType.getCarModel().name == CarAvailableModels.ZOE1) {
            return parseFloat(((this.apiBatteryStatusRenault?.apiData?.chargingInstantaneousPower ?? 0) / 1000).toFixed(2));
        }
        const chargingLimit = Math.min(this.getChargingLimit(carType) + 1, 100);
        const totalEnergy = carType.getBatterySize() * chargingLimit / 100;
        const availableEnergy = this.getAvailableEnergy(carType);
        const toCharge = totalEnergy - availableEnergy;
        const estimatedPower = 60 * toCharge / this.getRemainingMinutes();
        return parseFloat(estimatedPower.toFixed(2));
    }

    getAvailableEnergy(carType: CarType): number {
        const energy = this.getBatteryLevel() * carType.getBatterySize() / 100;
        return parseFloat(energy.toFixed(2));
    }

    getIsCarPlugged(): boolean {
        return this.apiBatteryStatusRenault?.apiData?.plugStatus == 1;
    }

    getIsCarCharging(): boolean {
        return this.apiBatteryStatusRenault?.apiData?.chargingStatus == 1.0 || this.getIsV2GOrV2L();

    }

    hasError(): boolean {
        return this.apiBatteryStatusRenault?.hasError ?? true;
    }
    shouldDisplayMap(): boolean {
        return this.apiLocationStatus?.apiData?.gpsLatitude !== undefined;
    }

    setLocationStatus(locationStatus: RenaultStatus): void {
        this.apiLocationStatus = locationStatus;
    }

    setChargingSettings(chargingSettingsFetch: RenaultStatus): void {
        this.apiChargesSettings = chargingSettingsFetch;
    }

    getMapLatitude(): number {
        return this.apiLocationStatus?.apiData?.gpsLatitude ?? 0;
    }

    getMapLongitude(): number {
        return this.apiLocationStatus?.apiData?.gpsLongitude ?? 0;
    }

    getLastMapUpdateDate(): Date {
        return new Date(this.apiLocationStatus?.apiData?.lastUpdateTime ?? 0);
    }

    shouldDisplayHVACCard(): boolean {
        return true;
    }

    shouldDisplayChargesCard(): boolean {
        return this.getChargesHistory().shouldDisplayChargesCard();
    }

    setChargesHistory(carFetch: RenaultStatus): void {
        this.apiChargesHistory = new RenaultChargesHandler(carFetch.apiData ?? []);
    }

    getChargesHistory(): RenaultChargesHandler {
        return this.apiChargesHistory;
    }

    getRemainingMinutes(): number {
        return this.apiBatteryStatusRenault?.apiData?.chargingRemainingTime ?? 0;
    }

    getEndChargeHour(): Date {
        const lastUpdate = this.getLastUpdateDate();
        const remainingMinutes = this.getRemainingMinutes();
        lastUpdate.setMinutes(lastUpdate.getMinutes() + remainingMinutes);
        return lastUpdate;
    }
    getChargeText(): string {
        const chargingStatus = this.apiBatteryStatusRenault?.apiData?.chargingStatus ?? -1;
        switch (chargingStatus) {
            case 0.1:
                return "scheduledCharge";
            case 0.2:
                return "endedCharge";
            case 0.3:
                return "scheduledCharge";
            case 1.0:
                return "charging";
            case -1.3:
                return "V2G";
            case -1.4:
                return "V2L";
            case -1.5:
                return "V2G";
            case -1.6:
                return "V2G";
            default:
                return "noCharging";
        }
    }

    getIsV2GOrV2L(): boolean {
        return (this.apiBatteryStatusRenault?.apiData?.chargingStatus ?? 0) <= -1.3;
    }

    getIsCarICE(): boolean {
        // return true this if the car has an ice engine
        return this.getICEFuelLevel() > 0;
    }

    getICEFuelLevel(): number {
        return this.apiCockpitRenault?.apiData?.fuelQuantity ?? 0;
    }

    getICERange(appPreferences: AppPreferences): number {
        let range = this.apiCockpitRenault?.apiData?.fuelAutonomy ?? 0;
        return getDistance(range, appPreferences, true);
    }

    getAllEnginesRange(appPreferences: AppPreferences): number {
        return this.getCarRange(appPreferences) + this.getICERange(appPreferences);
    }

    getChargingLimit(carType: CarType): number {
        return carType.getChargingLimit();
    }

    shouldDisplayNextChargeSettings(): boolean {
        const chargeMode = this.apiChargesSettings?.apiData?.mode ?? "";
        if ((chargeMode == "scheduled" || chargeMode == "delayed") && !this.getIsCarCharging()) {
            return true;
        }
        return false;
    }

    getChargingSettings(): ChargeSettingsStatus | null {
        return this.apiChargesSettings?.apiData ?? null;
    }

    setHVACStatus(carFetch: RenaultStatus): void {
        this.apiHVACStatus = carFetch;
    }

    getIsHVACRunning(): boolean {
        const hvacStatus = this.apiHVACStatus?.apiData?.hvacStatus ?? HVACStatusEnum.OFF;
        return hvacStatus == HVACStatusEnum.ON;
    }

    getMinimumHvacSOC(): number | null {
        return this.apiHVACStatus?.apiData?.socThreshold ?? null;
    }


}

export default RenaultApiHandler;