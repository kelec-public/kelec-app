import CarModel from "../../../lib/clients/cars/carModel";
import UserAccount from "../../../lib/clients/accounts/userAccount";
import { formatLicencePlate } from "../../kelec-licence-plate";

/**
 * Nom court d'une voiture, pour la distinguer des autres : « modèle · plaque » (plaque écrite selon son pays),
 * ou « modèle · VIN » quand la plaque n'est pas connue (le VIN est unique dans l'app).
 */
export function carLabel(car: CarModel): string {
    const plate = car.getRegistrationNumber();
    return `${car.getModel()} · ${plate ? formatLicencePlate(plate, car.getRegistrationCountry()) : car.getVin()}`;
}

/** La voiture du garage qui a ce VIN, s'il y en a une. */
export function findCar(user: UserAccount, vin: string): CarModel | undefined {
    return user.getCars().map(account => account.getCar()).find(car => car?.getVin() === vin);
}
