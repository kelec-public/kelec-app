import { CarMaker } from "../../../lib/clients/accounts/account";
import { CarDataLoader, CarLoaderDeps } from "../types/carLoader";
import { DemoCarLoader } from "./carLoaders/demoCarLoader";
import { HyundaiCarLoader } from "./carLoaders/hyundaiCarLoader";
import { RenaultCarLoader } from "./carLoaders/renaultCarLoader";

export function createCarLoader(deps: CarLoaderDeps): CarDataLoader {
    switch (deps.carModel.getCarmaker()) {
        case CarMaker.DEMO:
            return new DemoCarLoader(deps);
        case CarMaker.HYUNDAI:
            return new HyundaiCarLoader(deps);
        case CarMaker.ALPINE:
        case CarMaker.DACIA:
        case CarMaker.RENAULT:
            return new RenaultCarLoader(deps);
        default:
            throw new Error(`Aucun loader pour le constructeur ${deps.carModel.getCarmaker()}`);
    }
}