import Account from "../../../../lib/clients/accounts/account";
import HvacStatus from "../../models/HvacStatus";
import { HvacSource } from "../../types/hvacSource";

/** Constructeurs sans statut de climatisation : seule la commande de lancement est disponible. */
export class CommandOnlyHvacSource implements HvacSource {
    constructor(protected readonly account: Account) { }

    async loadCachedStatus(): Promise<HvacStatus | null> {
        return null;
    }

    async syncStatus(): Promise<HvacStatus | null> {
        return null;
    }

    launch(temperature: number): Promise<boolean> {
        return this.account.launchHVAC(temperature);
    }
}
