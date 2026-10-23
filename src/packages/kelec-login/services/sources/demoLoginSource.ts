import { CarMaker } from "../../../../lib/clients/accounts/account";
import DemoAccount from "../../../../lib/clients/accounts/demoAccount";
import { DEMO_VINS } from "../../../../lib/clients/accounts/demoCars";
import CarModel from "../../../../lib/clients/cars/carModel";
import { LoginResult } from "../../models/loginResult";
import { LoginSource } from "../../types/loginSource";
import { PLACEHOLDER_CAR_IMAGE } from "./renaultLoginSource";

/** Identifiants du compte de démonstration, utilisables quel que soit le constructeur choisi. */
export const isDemoCredentials = (email: string, password: string): boolean =>
    email.toLowerCase() === "kelec-demo@gmail.com" && password.toLowerCase() === "demo";

export class DemoLoginSource implements LoginSource {
    async authenticate(): Promise<LoginResult> {
        return { status: 'ok', account: new DemoAccount("demo", "demo", CarMaker.DEMO) };
    }

    async listVehicles(): Promise<CarModel[]> {
        return [
            new CarModel(DEMO_VINS.classic, 'Demo car', PLACEHOLDER_CAR_IMAGE, CarMaker.DEMO, 'AA001AA', 'FR'),
            new CarModel(DEMO_VINS.v2g, 'Demo V2G', PLACEHOLDER_CAR_IMAGE, CarMaker.DEMO, 'BB001BB', 'FR'),
            new CarModel(DEMO_VINS.hybrid, 'Demo PHEV', PLACEHOLDER_CAR_IMAGE, CarMaker.DEMO, 'CC001CC', 'FR'),
        ];
    }
}
