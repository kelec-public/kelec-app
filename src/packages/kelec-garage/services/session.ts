import UserAccount from "../../../lib/clients/accounts/userAccount";
import { RenaultCredentials } from "../../../lib/clients/carMakers/renaultCredentials";
import { saveNativeAccount } from "../../../lib/storage/sharedPlatformsData";
import { AppStorage } from "../../kelec-storage/appStorage";
import { PasswordVault } from "./passwordVault";

/**
 * Déconnexion : efface les identifiants de chaque voiture dans le stockage chiffré
 * (mot de passe, JWT et cookie de session), puis tout le stockage local et le compte des widgets.
 */
export async function logOut(user: UserAccount): Promise<void> {
    // allSettled : un identifiant introuvable ne doit pas empêcher la déconnexion
    await Promise.allSettled(user.getCars().flatMap(account => {
        const vin = account.getCar()?.getVin();
        return [
            ...(vin ? [PasswordVault.clear(vin)] : []),
            RenaultCredentials.clearCredentials(account.getEmail()),
        ];
    }));

    await AppStorage.clearAll();
    await saveNativeAccount(null);
}
