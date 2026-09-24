import Account, { CarMaker } from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { HvacSource } from "../types/hvacSource";
import { CommandOnlyHvacSource } from "./sources/commandOnlyHvacSource";
import { HyundaiHvacSource } from "./sources/hyundaiHvacSource";
import { RenaultHvacSource } from "./sources/renaultHvacSource";

export function createHvacSource(carModel: CarModel, account: Account): HvacSource {
    switch (carModel.getCarmaker()) {
        case CarMaker.ALPINE:
        case CarMaker.DACIA:
        case CarMaker.RENAULT:
            return new RenaultHvacSource(account, carModel.getVin());
        case CarMaker.HYUNDAI:
            return new HyundaiHvacSource(account, carModel.getVin());
        default:
            // Démo
            return new CommandOnlyHvacSource(account);
    }
}
