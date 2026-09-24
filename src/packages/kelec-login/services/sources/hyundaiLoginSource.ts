import Account, { CarMaker } from "../../../../lib/clients/accounts/account";
import HyundaiAccount from "../../../../lib/clients/accounts/hyundaiAccount";
import HyundaiClient from "../../../../lib/clients/carMakers/hyundaiClient";
import CarModel from "../../../../lib/clients/cars/carModel";
import HyundaiCar from "../../../../lib/clients/cars/hyundaiCar";
import { LoginResult } from "../../models/loginResult";
import { LoginSource } from "../../types/loginSource";

/** Code PIN utilisé pour les comptes Hyundai (valeur fixe, volontairement en dur). */
export const HYUNDAI_PIN = '8056';

export class HyundaiLoginSource implements LoginSource {
    async authenticate(email: string, password: string): Promise<LoginResult> {
        const normalizedEmail = email.toLowerCase();
        const client = new HyundaiClient(normalizedEmail, password, HYUNDAI_PIN);

        // l'utilisateur doit d'abord faire partie des personnes autorisées
        if (!await client.checkAuthorised()) {
            return { status: 'error', messageKey: 'Not yet available' };
        }
        if (!await client.checkLogin()) {
            return { status: 'error', messageKey: 'invalidPassWord' };
        }
        return { status: 'ok', account: new HyundaiAccount(normalizedEmail, password, HYUNDAI_PIN) };
    }

    async listVehicles(account: Account): Promise<CarModel[]> {
        const hyundaiAccount = account as HyundaiAccount;
        const client = new HyundaiClient(hyundaiAccount.getEmail(), hyundaiAccount.getPassword(), hyundaiAccount.getPinCode());
        const vehicles = await client.getVehicles();
        if (vehicles.hasError === true) throw new Error('Unable to fetch Hyundai vehicles');

        return vehicles.vehicles.map(vehicle =>
            new HyundaiCar(vehicle.vin, vehicle.name, vehicle.imageUrl, CarMaker.HYUNDAI, vehicle.registrationNumber));
    }
}
