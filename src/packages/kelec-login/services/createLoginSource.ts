import { CarMaker } from "../../../lib/clients/accounts/account";
import { LoginSource } from "../types/loginSource";
import { DemoLoginSource } from "./sources/demoLoginSource";
import { HyundaiLoginSource } from "./sources/hyundaiLoginSource";
import { RenaultLoginSource } from "./sources/renaultLoginSource";

export function createLoginSource(carMaker: CarMaker): LoginSource {
    switch (carMaker) {
        case CarMaker.DEMO:
            return new DemoLoginSource();
        case CarMaker.HYUNDAI:
            return new HyundaiLoginSource();
        case CarMaker.ALPINE:
        case CarMaker.DACIA:
        case CarMaker.RENAULT:
        default:
            return new RenaultLoginSource(carMaker);
    }
}
