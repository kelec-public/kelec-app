import { V2GApiSession } from "../carMakers/renault/v2gApiResponse";
import RenaultClient from "../carMakers/renaultClient";
import CarModel from "../cars/carModel";
import Account, { CarFetchStatus, CarMaker } from "./account";

class RenaultAccount extends Account {
    kamereonAccountID: string;
    firstName?: string;
    lastName?: string;
    constructor(email: string, password: string, kamereonAccountID: string, car?: CarModel, firstName?: string, lastName?: string, carMaker: CarMaker = CarMaker.RENAULT) {
        super(email, password, carMaker, car);
        this.kamereonAccountID = kamereonAccountID;
        this.firstName = firstName;
        this.lastName = lastName;
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
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        const data = await client.getBatteryStatus(vin);
        return data;
    }

    fetchCarCockpit = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        const data = await client.getCockpit(vin);
        return data;
    }

    fetchLocationStatus = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        const data = await client.getLocation(vin);
        return data;
    }

    launchHVAC = async (temperature: number): Promise<boolean> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        return await client.launchHVAC(this.getCar()?.getVin() ?? "", temperature);
    }

    fetchChargesHistory = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        const data = await client.getChargesHistory(vin);
        return data;
    }

    fetchV2GSessions = async (vin: string): Promise<V2GApiSession[] | null> => {
        try {
            const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
            const chargesHistory = await client.getV2GChargesHistory(vin);
            return chargesHistory;
        } catch {
            return null;
        }
    }

    fetchChargesSettings = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        if (client.getChargeSettings) {
            return await client.getChargeSettings(vin);
        }
        return { hasError: true }
    }

    fetchHVACStatus = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        if (client.getHVACStatus) {
            return await client.getHVACStatus(vin);
        }
        return { hasError: true }
    }

    fetchSoCLevels = async (vin: string): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        if (client.getSoCLevels) {
            return await client.getSoCLevels(vin);
        }
        return { hasError: true }
    }

    setSoCLevels = async (vin: string, socTarget?: number, socMin?: number): Promise<CarFetchStatus> => {
        const client = new RenaultClient(this.getEmail(), this.getPassword(), this.getKamereonAccountID());
        if (client.setSoCLevels) {
            return await client.setSoCLevels(vin, socTarget, socMin);
        }
        return { hasError: true }
    }
}

export default RenaultAccount;