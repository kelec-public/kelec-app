
import AppPreferences from "../../appPreferences/model/appPreferences";
import { CarFetchStatus } from "../accounts/account";
import { ChargeSettingsStatus } from "../carMakers/renaultClient";
import CarType from "../cars/carTypes/carType";
import RenaultChargesHandler from "./renaultChargesHandler";

interface ApiHandler {
    getCarRange(appPreferences: AppPreferences): number;
    getCarMileage(appPreferences: AppPreferences): number;
    getBatteryLevel(): number;
    setApiData(carFetch: CarFetchStatus): void;
    getAvailableEnergy(carType: CarType): number;
    setCockpitStatus?(carFetch: CarFetchStatus): void;
    setLocationStatus?(carFetch: CarFetchStatus): void;
    setChargesHistory?(carFetch: CarFetchStatus): void;
    setHVACStatus?(carFetch: CarFetchStatus): void;
    getIsHVACRunning(): boolean;
    getChargesHistory(): RenaultChargesHandler;
    getLastUpdateDate(): Date;
    hasError(): boolean;
    getIsCarPlugged(): boolean;
    getIsCarCharging(): boolean;
    shouldDisplayMap(): boolean;
    getMapLongitude(): number;
    getMapLatitude(): number;
    getLastMapUpdateDate(): Date;
    shouldDisplayHVACCard(): boolean;
    shouldDisplayChargesCard(): boolean;
    getRemainingMinutes(): number;
    getEndChargeHour(): Date;
    getChargeText(): string;
    getChargingPower(carType: CarType): number;
    getIsCarICE(): boolean;
    getICERange(appPreferences: AppPreferences): number;
    getICEFuelLevel(): number;
    getAllEnginesRange(appPreferences: AppPreferences): number;
    setChargingLimit(limit: number): void;
    getChargingLimit(): number;
    shouldDisplayChargingLimit(): boolean;
    getIsV2GOrV2L(): boolean;

    // for charging settings
    setChargingSettings?(carFetch: CarFetchStatus): void;
    shouldDisplayNextChargeSettings(): boolean;
    getChargingSettings(): ChargeSettingsStatus | null;

    // for hvac
    getMinimumHvacSOC(): number | null;
}


export default ApiHandler;