import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { ChargesSource } from "../types/chargesSource";
import { DemoChargesSource } from "./sources/demoChargesSource";
import { RenaultChargesSource } from "./sources/renaultChargesSource";

/** Source des charges selon le constructeur ; null si l'historique n'est pas supporté. */
export function createChargesSource(carModel: CarModel, account: Account): ChargesSource | null {
    switch (carModel.getCarmaker()) {
        case CarMaker.DEMO:
            return new DemoChargesSource();
        case CarMaker.ALPINE:
        case CarMaker.DACIA:
        case CarMaker.RENAULT:
            return new RenaultChargesSource(account, carModel.getVin());
        default:
            return null;
    }
}
