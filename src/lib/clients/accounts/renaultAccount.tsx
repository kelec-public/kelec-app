import { V2GApiSession } from "../carMakers/renault/v2gApiResponse";
import RenaultClient from "../carMakers/renaultClient";
import CarModel from "../cars/carModel";
import Account, { CarFetchStatus, CarMaker } from "./account";

class RenaultAccount extends Account {
    kamereonAccountID: string;
    firstName?: string;
    lastName?: string;

    private _client: RenaultClient;

    constructor(email: string, password: string, kamereonAccountID: string, car?: CarModel, firstName?: string, lastName?: string, carMaker: CarMaker = CarMaker.RENAULT) {
        super(email, password, carMaker, car);
        this.kamereonAccountID = kamereonAccountID;
        this.firstName = firstName;
        this.lastName = lastName;
        this._client = new RenaultClient(email, password, kamereonAccountID);
    }

    getKamereonAccountID(): string {
        return this.kamereonAccountID;
    }

    getFirstName(): string {
        return this.firstName ?? '';
    }

    getLastName(): string {
        return this.lastName ?? '';
    }

    fetchCarStatus = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getBatteryStatus(vin);
    }

    fetchCarCockpit = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getCockpit(vin);
    }

    fetchLocationStatus = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getLocation(vin);
    }

    launchHVAC = async (temperature: number): Promise<boolean> => {
        return await this._client.launchHVAC(this.getCar()?.getVin() ?? "", temperature);
    }

    fetchChargesHistory = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getChargesHistory(vin);
    }

    fetchV2GSessions = async (vin: string): Promise<V2GApiSession[] | null> => {
        try {
            const chargesHistory = await this._client.getV2GChargesHistory(vin);
            return chargesHistory;
        } catch {
            return null;
        }
    }

    fetchChargesSettings = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getChargeSettings(vin);
    }

    fetchHVACStatus = async (vin: string): Promise<CarFetchStatus> => {
        return await this._client.getHVACStatus(vin);
    }
}

export default RenaultAccount;