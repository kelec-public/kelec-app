import AppPreferences from "../../appPreferences/model/appPreferences";
import { getDistance } from "../../graphics/utils";
import { HyundaiStatus } from "../carMakers/hyundaiClient";
import CarType from "../cars/carTypes/carType";
import ApiHandler from "./apiHandler";
import { parseHyundaiTime } from "../carMakers/hyundaiTime";

class HyundaiApiHandler implements ApiHandler {
    private apiDataHyundai?: HyundaiStatus;

    constructor(apiData?: HyundaiStatus) {
        this.apiDataHyundai = apiData;
    }

    private convertHyundaiTime(time: string): Date {
        return parseHyundaiTime(time);
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
        const totalEnergy = this.getChargingLimit(carType) * this.getAvailableEnergy(carType) / this.getBatteryLevel();
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

    getChargingLimit(carType: CarType): number {
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

    shouldDisplayNextChargeSettings(): boolean {
        return false;
    }

    getChargingSettings(): null {
        return null;
    }

    getIsV2GOrV2L(): boolean {
        return false;
    }
}

export default HyundaiApiHandler;