import UserAccount from "../../../lib/clients/accounts/userAccount";
import { MoveDirection } from "../../../lib/clients/accounts/account";
import { RenaultCredentials } from "../../../lib/clients/carMakers/renaultCredentials";
import { AccountRepository } from "./accountRepository";

/**
 * Actions sur les voitures de l'utilisateur. Chacune modifie le `UserAccount` puis l'enregistre ;
 * c'est à l'appelant de recharger l'utilisateur (`reloadUser`) ensuite.
 *
 * Un VIN est unique dans toute l'app, et chaque VIN a exactement un compte : le VIN suffit à identifier une voiture.
 */
export class GarageService {
    constructor(private readonly user: UserAccount) { }

    async selectDefaultCar(vin: string): Promise<void> {
        this.user.setSelectedCar(vin);
        await this.save();
    }

    async moveCar(vin: string, direction: MoveDirection): Promise<void> {
        this.user.moveCar(vin, direction);
        await this.save();
    }

    async renameCar(vin: string, name: string): Promise<void> {
        this.user.renameACar(vin, name);
        await this.save();
    }

    /**
     * Retire la voiture du compte. Ses données locales (historique de charge, image, caches…)
     * sont volontairement conservées : elles sont réutilisées si la voiture est réimportée.
     */
    async deleteCar(vin: string): Promise<void> {
        const account = this.user.getCars().find(car => car.getCar()?.getVin() === vin);
        if (!account) return;

        await RenaultCredentials.clearCredentials(account.getEmail());
        this.user.deleteACar(vin);
        await this.save();
    }

    private save(): Promise<void> {
        return AccountRepository.save(this.user);
    }
}
