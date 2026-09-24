import { formatNumberWithLeadingZero } from "../../../lib/graphics/utils";
import Charge from "./Charge";

/** Historique complet des charges d'une voiture, tel que stocké. */
class ChargesHistory {
    constructor(
        readonly charges: Charge[] = [],
        readonly hasError: boolean = false,
    ) { }

    /** Historique indisponible (pas encore chargé, ou constructeur non supporté). */
    static unavailable(): ChargesHistory {
        return new ChargesHistory([], true);
    }

    shouldDisplayChargesCard(): boolean {
        return !this.hasError;
    }

    getCharges(): Charge[] {
        return this.charges;
    }

    getTotalEnergyRecovered(): number {
        const total = this.charges.reduce((acc, charge) => acc + charge.getEnergyRecovered(), 0);
        return parseFloat(total.toFixed(2));
    }

    /** [heures, minutes sur 2 chiffres] */
    getTotalTimeCharging(): (string | number)[] {
        const total = this.charges.reduce((acc, charge) => acc + charge.getDurationInMinutes(), 0);
        return [Math.floor(total / 60), formatNumberWithLeadingZero(total % 60)];
    }
}

export default ChargesHistory;
