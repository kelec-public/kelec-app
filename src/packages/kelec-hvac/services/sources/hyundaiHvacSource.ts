import Account from "../../../../lib/clients/accounts/account";
import { HyundaiStatus } from "../../../../lib/clients/carMakers/hyundaiClient";
import { VinStorage } from "../../../kelec-storage/vinStorage";
import HvacStatus from "../../models/HvacStatus";
import { CommandOnlyHvacSource } from "./commandOnlyHvacSource";

/** Réponse de statut Hyundai, enregistrée par le car loader (`storageHandler.storeApiData`). */
const CAR_STATUS_KEY = 'batteryStatus';

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
        const carStatus = await VinStorage.getJSON<HyundaiStatus>(this.vin, CAR_STATUS_KEY);
        const airCtrlOn = carStatus?.apiData?.vehicleStatus?.airCtrlOn;
        return airCtrlOn === undefined ? null : new HvacStatus(airCtrlOn);
    }

    /** Appelé après un fetch batterie réussi : le cache contient déjà la réponse à jour. */
    syncStatus(): Promise<HvacStatus | null> {
        return this.loadCachedStatus();
    }
}
