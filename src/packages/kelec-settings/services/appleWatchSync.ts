import AppPreferences from "../../../lib/appPreferences/model/appPreferences";
import { CarMaker } from "../../../lib/clients/accounts/account";
import UserAccount from "../../../lib/clients/accounts/userAccount";
import { RenaultCredentials } from "../../../lib/clients/carMakers/renaultCredentials";
import { sendDataToAppleWatch } from "../../../lib/storage/sharedPlatformsData";
import { withoutPasswords } from "../../kelec-garage";

/**
 * Mots de passe dont la montre a besoin, par VIN : uniquement Hyundai,
 * Renault / Dacia / Alpine passent par les cookies de session.
 */
export function watchPasswords(user: UserAccount): Record<string, string> {
    const passwords: Record<string, string> = {};
    user.getCars().forEach(account => {
        const vin = account.getCar()?.getVin();
        const password = account.getPassword();
        if (account.getCarMaker() === CarMaker.HYUNDAI && vin && password) {
            passwords[vin] = password;
        }
    });
    return passwords;
}

/**
 * Envoie à la montre (Apple Watch sur iOS, Wear OS sur Android) le compte (sans mot de passe), les préférences,
 * les cookies de session et les mots de passe Hyundai, que la montre range dans son stockage chiffré.
 */
export async function syncWithAppleWatch(user: UserAccount, preferences: AppPreferences): Promise<void> {
    const emails = user.getCars().map(account => account.getEmail());
    const cookieValues = await RenaultCredentials.getAllCookieValues(emails);
    sendDataToAppleWatch(withoutPasswords(user), preferences, cookieValues, watchPasswords(user));
}
