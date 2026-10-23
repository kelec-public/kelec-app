import { V2GApiSession } from "../carMakers/renault/v2gApiResponse";
import { BatteryStatus, ChargeSettingsStatus, CockpitStatus, MapLocationStatus } from "../carMakers/renaultClient";

const mockData = require('../../../assets/car_data/mockDemoData.json');

/** Données d'une voiture de démo, au format de l'API Renault. */
export type DemoCarData = {
    battery: BatteryStatus;
    cockpit: CockpitStatus;
    map: MapLocationStatus;
    chargesSettings?: ChargeSettingsStatus;
    charges: any[];
    v2gSessions?: V2GApiSession[];
};

/** Voitures de démo : charge classique, V2G et hybride rechargeable. Mêmes VIN et valeurs côté natif : `DemoCar` (iOS et Android). */
export const DEMO_VINS = {
    classic: 'VF1AA',
    v2g: 'VF1AA2',
    hybrid: 'VF1AA3',
};

/** Données de la voiture de démo `vin` ; celles de la voiture classique si le VIN est inconnu. */
export const demoCarData = (vin: string): DemoCarData =>
    mockData.cars[vin] ?? mockData.cars[DEMO_VINS.classic];
