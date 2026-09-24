import Account from "../../../../lib/clients/accounts/account";
import { CarStatusCache } from "../../../kelec-car-page";
import HvacStatus from "../../models/HvacStatus";
import { CommandOnlyHvacSource } from "./commandOnlyHvacSource";

/**
 * Hyundai ne fournit pas de statut de climatisation séparé : on lit `vehicleStatus.airCtrlOn`
 * dans la réponse de statut de la voiture, déjà récupérée pour la batterie.
 * L'API ne donne pas de SOC minimum.
 */
export class HyundaiHvacSource extends CommandOnlyHvacSource {
    constructor(account: Account, private readonly vin: string) {
        super(account);
    }

    async loadCachedStatus(): Promise<HvacStatus | null> {
        const carStatus = await CarStatusCache.getHyundaiStatus(this.vin);
        const airCtrlOn = carStatus?.apiData?.vehicleStatus?.airCtrlOn;
        return airCtrlOn === undefined ? null : new HvacStatus(airCtrlOn);
    }

    /** Appelé après un fetch batterie réussi : le cache contient déjà la réponse à jour. */
    syncStatus(): Promise<HvacStatus | null> {
        return this.loadCachedStatus();
    }
}
