import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { LocationSource } from "../types/locationSource";
import { DemoLocationSource } from "./sources/demoLocationSource";
import { HyundaiLocationSource } from "./sources/hyundaiLocationSource";
import { RenaultLocationSource } from "./sources/renaultLocationSource";

export function createLocationSource(carModel: CarModel, account: Account): LocationSource | null {
    switch (carModel.getCarmaker()) {
        case CarMaker.DEMO:
            return new DemoLocationSource();
        case CarMaker.ALPINE:
        case CarMaker.DACIA:
        case CarMaker.RENAULT:
            return new RenaultLocationSource(account, carModel.getVin());
        case CarMaker.HYUNDAI:
            return new HyundaiLocationSource(carModel.getVin());
        default:
            return null;
    }
}
