import { getMileageHistory, MileageLog } from "../../../lib/storage/sharedPlatformsData";

/** (Debug) Les `count` dernières entrées de l'historique de kilométrage écrit par le widget, de la plus ancienne à la plus récente. */
export const lastMileageEntries = async (vin: string, count = 10): Promise<MileageLog[]> => {
    const history = await getMileageHistory(vin);
    return (history ?? []).slice(-count);
};

/** « 06/10/2026 14:05:00 : 45801 km » */
export const formatMileageEntry = (entry: MileageLog): string =>
    `${new Date(entry.timestamp).toLocaleString()} : ${entry.mileage} km`;
