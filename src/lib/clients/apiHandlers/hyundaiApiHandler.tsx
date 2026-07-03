import AppPreferences from "../../appPreferences/model/appPreferences";
import { getDistance } from "../../graphics/utils";
import { HyundaiStatus } from "../carMakers/hyundaiClient";
import CarType from "../cars/carTypes/carType";
import ApiHandler from "./apiHandler";
import RenaultChargesHandler from "./renaultChargesHandler";

class HyundaiApiHandler implements ApiHandler {
    private apiDataHyundai?: HyundaiStatus;

    constructor(apiData?: HyundaiStatus) {
        this.apiDataHyundai = apiData;
    }

    private convertHyundaiTime(time: string): Date {
        // convert a string date from hyundai to a date object
        // under the format 20240409175202 to 2024-04-09T17:52:02
        const dateYear = time.substring(0, 4);
        const dateMonth = time.substring(4, 6);
        const dateDay = time.substring(6, 8);
        const dateHour = time.substring(8, 10);
        const dateMinute = time.substring(10, 12);
        const dateSecond = time.substring(12, 14);
        const dateFull = dateYear + '-'
            + dateMonth + '-'
            + dateDay + 'T'
            + dateHour + ':'
            + dateMinute + ':'
            + dateSecond + 'Z';
        return new Date(dateFull);
    }


    setApiData(apiData: HyundaiStatus): void {
        this.apiDataHyundai = apiData;
    }

    getCarRange(appPreferences: AppPreferences): number {
        let range = this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.drvDistance[0].rangeByFuel.evModeRange.value ?? 0;
        return getDistance(range, appPreferences, true);
    }



    getLastUpdateDate(): Date {
        return this.convertHyundaiTime(this.apiDataHyundai?.apiData?.vehicleStatus.time ?? '');
    }



    getCarMileage(appPreferences: AppPreferences): number {
        let range = this.apiDataHyundai?.apiData?.odometer.value ?? 0;
        return getDistance(range, appPreferences);
    }

    getBatteryLevel(): number {
        return this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.batteryStatus ?? 0;
    }

    getAvailableEnergy(carType: CarType): number {
        return parseFloat((this.getBatteryLevel() / 100 * carType.getBatterySize()).toFixed(1));
    }

    getIsCarPlugged(): boolean {
        return this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.batteryPlugin != 0;
    }

    getIsCarCharging(): boolean {
        return this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.batteryCharge ?? false;
    }

    hasError(): boolean {
        return this.apiDataHyundai?.hasError ?? true;
    }

    shouldDisplayMap(): boolean {
        return this.apiDataHyundai?.apiData?.vehicleLocation.coord.lat !== undefined;
    }

    getMapLatitude(): number {
        return this.apiDataHyundai?.apiData?.vehicleLocation.coord.lat ?? 0;
    }

    getMapLongitude(): number {
        return this.apiDataHyundai?.apiData?.vehicleLocation.coord.lon ?? 0;
    }

    getLastMapUpdateDate(): Date {
        return this.convertHyundaiTime(this.apiDataHyundai?.apiData?.vehicleLocation.time ?? '');
    }

    shouldDisplayHVACCard(): boolean {
        return true;
    }

    shouldDisplayChargesCard(): boolean {
        return false;
    }

    getChargesHistory(): RenaultChargesHandler {
        return new RenaultChargesHandler([], true);
    }

    getRemainingMinutes(): number {
        return this.apiDataHyundai?.apiData?.vehicleStatus?.evStatus.remainTime2.atc.value ?? 0;
    }

    getEndChargeHour(): Date {
        const lastUpdate = this.getLastUpdateDate();
        const remainingMinutes = this.getRemainingMinutes();
        lastUpdate.setMinutes(lastUpdate.getMinutes() + remainingMinutes);
        return lastUpdate;
    }

    getChargeText(): string {
        return this.getIsCarCharging() ? 'charging' : 'noCharging';
    }

    getChargingPower(carType: CarType): number {
        const totalEnergy = this.getChargingLimit() * this.getAvailableEnergy(carType) / this.getBatteryLevel();
        const toCharge = totalEnergy - this.getAvailableEnergy(carType);
        const estimatedPower = 60 * toCharge / this.getRemainingMinutes();
        return parseFloat(estimatedPower.toFixed(2));
    }

    getIsCarICE(): boolean {
        return false;
    }

    getICERange(): number {
        return 0;
    }

    getICEFuelLevel(): number {
        return 0;
    }

    getAllEnginesRange(): number {
        return 0;
    }

    setChargingLimit(limit: number): void {
    }

    getChargingLimit(): number {
        const targetSOC = this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.reservChargeInfos.targetSOClist;
        if (targetSOC === undefined) {
            return 100;
        }
        if (this.apiDataHyundai?.apiData?.vehicleStatus.evStatus.batteryPlugin == 1) {
            // DC charging
            for (const target of targetSOC) {
                if (target.plugType == 0) {
                    return target.targetSOClevel;
                }
            }
        } else {
            // AC charging
            for (const target of targetSOC) {
                if (target.plugType == 1) {
                    return target.targetSOClevel;
                }
            }
        }
        return 100;
    }

    shouldDisplayChargingLimit(): boolean {
        return true;
    }

    shouldDisplayNextChargeSettings(): boolean {
        return false;
    }

    getChargingSettings(): null {
        return null;
    }

    getIsHVACRunning(): boolean {
        // to implement
        return false;
    }

    getIsV2GOrV2L(): boolean {
        return false;
    }

    getMinimumHvacSOC(): number | null {
        return null;
    }
}

export default HyundaiApiHandler;