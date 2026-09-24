import { AccountInterface, CarMaker } from "../../../lib/clients/accounts/account";
import DemoAccount from "../../../lib/clients/accounts/demoAccount";
import HyundaiAccount from "../../../lib/clients/accounts/hyundaiAccount";
import RenaultAccount from "../../../lib/clients/accounts/renaultAccount";
import UserAccount, { UserAccountInterface } from "../../../lib/clients/accounts/userAccount";
import CarModel, { CarModelInterface } from "../../../lib/clients/cars/carModel";

export type BuiltUserAccount = {
    user: UserAccount;
    /** Au moins un mot de passe n'était pas encore dans le stockage chiffré : il faut réenregistrer le compte. */
    needsPasswordMigration: boolean;
};

/**
 * Reconstruit un `UserAccount` (et le bon type d'`Account` par constructeur) à partir du JSON stocké.
 * Les mots de passe viennent du stockage chiffré ; à défaut, de l'ancien JSON en clair (migration).
 */
export async function buildUserAccount(
    stored: UserAccountInterface,
    getPassword: (vin: string) => Promise<string | null>,
): Promise<BuiltUserAccount> {
    const user = new UserAccount(stored.selectedCar, []);
    let needsPasswordMigration = false;

    for (const raw of stored.cars) {
        const account = raw as unknown as AccountInterface;
        const car = account.car as unknown as CarModelInterface;

        let password = await getPassword(car.vin);
        if (password == null || password == "") {
            needsPasswordMigration = true;
            password = account.password;
        }

        const carModel = new CarModel(car.vin, car.model, car.imageUrl, car.carMaker, car.registrationNumber);
        switch (account.carMaker) {
            case CarMaker.ALPINE:
            case CarMaker.DACIA:
            case CarMaker.RENAULT:
                user.addCar(new RenaultAccount(account.email, password ?? '', account.kamereonAccountID ?? "", carModel, account.firstName, account.lastName, account.carMaker));
                break;
            case CarMaker.HYUNDAI:
                user.addCar(new HyundaiAccount(account.email, password ?? '', account.pinCode ?? "", carModel));
                break;
            case CarMaker.DEMO:
                user.addCar(new DemoAccount(account.email, password ?? '', account.carMaker, carModel));
                break;
        }
    }

    return { user, needsPasswordMigration };
}
