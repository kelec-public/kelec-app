import HvacStatus from "../../models/HvacStatus";
import { CommandOnlyHvacSource } from "./commandOnlyHvacSource";

/** SOC minimum (%) des voitures démo pour lancer la climatisation. */
export const DEMO_MINIMUM_HVAC_SOC = 10;

/** Démo : jamais « en cours », pas d'arrêt, mais le SOC minimum est connu. */
export class DemoHvacSource extends CommandOnlyHvacSource {
    async loadCachedStatus(): Promise<HvacStatus | null> {
        return new HvacStatus(false, DEMO_MINIMUM_HVAC_SOC);
    }

    syncStatus(): Promise<HvacStatus | null> {
        return this.loadCachedStatus();
    }
}
