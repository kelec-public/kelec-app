import { CarMaker } from "../../accounts/account";
import { BatteryApi, BrandApi, ModelApi } from "../../kelec-api/kelecApiHandler";

export interface LeasingData {
    startDate?: Date;
    endDate?: Date;
    totalMileage?: number;
    startMileage?: number;
}

interface CarTypeInterface {
    brand: BrandApi;
    model: ModelApi;
    battery: BatteryApi;
    chargingLimit: number;

    // leasing
    leasing?: LeasingData;

    // v2g
    supportsV2G?: boolean;
}

enum CarAvailableModels {
    MEGANE = "megane_e_tech",
    SCENIC = "scenic_e_tech",
    R5 = "r5_e_tech",
    R4 = "r4_e_tech",
    KONA = "kona",
    IONIQ = "ioniq",
    ZOE1 = 'Zoe 1',
    ZOE_E_TECH = "zoe_e_tech",
    TWINGO = "twingo_e_tech",
    TRAFIC = "trafic_e_tech",
    MASTER = "master_e_tech",
    A290 = "a290",
    A390 = "a390",
}

const AUTHORISED_MODELS = [
    CarAvailableModels.MEGANE,
    CarAvailableModels.SCENIC,
    CarAvailableModels.R5,
    CarAvailableModels.R4,
    CarAvailableModels.TWINGO,
    CarAvailableModels.TRAFIC,
    CarAvailableModels.MASTER,
    CarAvailableModels.A290,
    CarAvailableModels.A390
]

class CarType {
    // to handle the user input fields about a car (i.e. battery size, model...)
    private readonly brand: BrandApi;
    private readonly model: ModelApi;
    private readonly battery: BatteryApi;
    private chargingLimit: number;
    private leasing?: LeasingData;
    private supportsV2G?: boolean;

    constructor(carInterface: CarTypeInterface) {
        this.brand = carInterface.brand;
        this.model = carInterface.model;
        this.battery = carInterface.battery;
        this.chargingLimit = carInterface?.chargingLimit ?? 0;
        this.leasing = carInterface?.leasing;
        this.supportsV2G = carInterface?.supportsV2G;
    }

    getBattery(): BatteryApi {
        return this.battery;
    }

    setBatterySize(batterySize: number): void {
        this.battery.size = batterySize;
    }

    shouldDisplayChargingLimit(): boolean {
        return (AUTHORISED_MODELS.includes(this.model.name as CarAvailableModels) || this.brand.name === CarMaker.HYUNDAI);
    }

    getBatterySize(): number {
        return this.battery.size ?? 0;
    }

    getChargingLimit(): number {
        // if custom charging limit is allowed
        if (AUTHORISED_MODELS.includes(this.model.name as CarAvailableModels)) {
            return this.chargingLimit ?? 100;
        }

        // all other models
        return 100;
    }

    setChargingLimit(chargingLimit: number): void {
        this.chargingLimit = chargingLimit;
    }

    getCarModel(): ModelApi {
        return this.model;
    }

    getBrand(): BrandApi {
        return this.brand;
    }

    getMaxAcCharging(): number {
        return this.battery.max_ac_power;
    }

    getMaxDcCharging(): number {
        return this.battery.max_dc_power;
    }

    getLeasingData(): LeasingData | undefined {
        return this.leasing;
    }

    setLeasingData(leasingData: LeasingData | undefined): void {
        this.leasing = leasingData;
    }

    getMaximumLeasingMileage(): number {
        let start_date = new Date(this.leasing!.startDate!);
        let end_date = new Date(this.leasing!.endDate!);
        const today = new Date();
        if (today <= start_date) return 0;
        if (today >= end_date) return this.leasing!.totalMileage! + (this.leasing!.startMileage ?? 0);

        const totalDays = (end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays = (today.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24);

        const mileagePerDay = (this.leasing!.totalMileage! - (this.leasing!.startMileage ?? 0)) / totalDays;
        return Math.round(mileagePerDay * elapsedDays + (this.leasing!.startMileage ?? 0));

    }

    clone(): CarType {
        return new CarType({
            brand: this.brand,
            model: this.model,
            battery: this.battery,
            chargingLimit: this.chargingLimit,
            leasing: this.leasing,
            supportsV2G: this.supportsV2G
        })
    }

    getSupportsV2G = (): boolean => {
        return this.supportsV2G ?? false;
    }

    setSupportsV2G = (supportsV2G: boolean): void => {
        this.supportsV2G = supportsV2G;
    }

}

export default CarType;
export { CarAvailableModels, AUTHORISED_MODELS };
export type { CarTypeInterface };