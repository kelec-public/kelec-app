import Account, { CarMaker } from "../../../../lib/clients/accounts/account";
import RenaultAccount from "../../../../lib/clients/accounts/renaultAccount";
import { CarMakerClientErrors } from "../../../../lib/clients/carMakers/carMakerClient";
import RenaultClient from "../../../../lib/clients/carMakers/renaultClient";
import CarModel from "../../../../lib/clients/cars/carModel";
import RenaultCar from "../../../../lib/clients/cars/renaultCar";
import { LoginResult } from "../../models/loginResult";
import { LoginSource } from "../../types/loginSource";
import { loginErrorMessageKey } from "../loginErrors";

export const PLACEHOLDER_CAR_IMAGE = 'https://api.kelec.app/placeholder';

type RenaultVehicleAsset = { assetType?: string; viewpoint?: string; renditions: { url: string }[] };

/** Image de la voiture : la vue « mybrand_2 », sinon une image par défaut. */
export const pickRenaultImage = (assets: RenaultVehicleAsset[] | undefined): string => {
    let imageUrl = PLACEHOLDER_CAR_IMAGE;
    for (const asset of assets ?? []) {
        if (asset.assetType === "PICTURE" && asset.viewpoint === "mybrand_2") {
            imageUrl = asset.renditions[0].url;
        }
    }
    return imageUrl;
};

/** Renault, Dacia et Alpine (même API). */
export class RenaultLoginSource implements LoginSource {
    constructor(private readonly carMaker: CarMaker) { }

    async authenticate(email: string, password: string): Promise<LoginResult> {
        const trimmedEmail = email.trim().toLowerCase();
        const response = await new RenaultClient(trimmedEmail, password).getKamereonAccount(this.carMaker);

        if (response.canLogin) {
            return {
                status: 'ok',
                account: new RenaultAccount(trimmedEmail, password, response.kamereonAccountID ?? '', undefined, response.firstName, response.lastName, this.carMaker),
            };
        }
        if (response.errorMessage === CarMakerClientErrors.PENDING_TFA) {
            return { status: 'tfa', regToken: response.regToken ?? '' };
        }
        return { status: 'error', messageKey: loginErrorMessageKey(response.errorMessage) };
    }

    async listVehicles(account: Account): Promise<CarModel[]> {
        const renaultAccount = account as RenaultAccount;
        const client = new RenaultClient(renaultAccount.getEmail(), renaultAccount.getPassword(), renaultAccount.getKamereonAccountID());
        const vehicles = await client.getVehicles();
        if (vehicles.hasError) throw new Error('Unable to fetch Renault vehicles');

        return vehicles.vehicles.map(vehicle => new RenaultCar(
            vehicle.vin,
            vehicle.vehicleDetails.model.label,
            pickRenaultImage(vehicle.vehicleDetails.assets),
            account.getCarMaker(),
            vehicle.vehicleDetails.registrationNumber,
        ));
    }
}
