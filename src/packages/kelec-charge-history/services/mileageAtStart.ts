import { MileageLog } from "../../../lib/storage/sharedPlatformsData";
import Charge from "../models/Charge";

/**
 * Kilométrage au début de la charge d'après l'historique kilométrique.
 * Renvoie [kilométrage, estApproximatif], ou null si l'historique ne couvre pas la charge.
 */
export const findMileageAtStart = (charge: Charge, mileageHistory: MileageLog[]): [number, boolean] | null => {
    const chargeTime = charge.getStartDate().getTime();

    // L'historique doit commencer avant la charge
    if (chargeTime < new Date(mileageHistory[0].timestamp).getTime()) {
        return null;
    }

    const startMileage = mileageHistory.find(log => new Date(log.timestamp).getTime() >= chargeTime);
    if (!startMileage) {
        return null;
    }

    let isInaccurate = new Date(startMileage.timestamp).getTime() > charge.getEndDate().getTime();

    if (isInaccurate) {
        // Si le dernier relevé avant la charge a le même kilométrage, la valeur reste fiable
        const previousMileage = mileageHistory.slice().reverse()
            .find(log => new Date(log.timestamp).getTime() < chargeTime);
        isInaccurate = previousMileage?.mileage !== startMileage.mileage;
    }

    return [startMileage.mileage, isInaccurate];
};
