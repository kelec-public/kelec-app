import AppPreferences from "../../../lib/appPreferences/model/appPreferences";
import UserAccount from "../../../lib/clients/accounts/userAccount";
import { RenaultCredentials } from "../../../lib/clients/carMakers/renaultCredentials";
import { sendDataToAppleWatch } from "../../../lib/storage/sharedPlatformsData";

/** Envoie le compte, les préférences et les cookies de session à l'Apple Watch. */
export async function syncWithAppleWatch(user: UserAccount, preferences: AppPreferences): Promise<void> {
    const emails = user.getCars().map(account => account.getEmail());
    const cookieValues = await RenaultCredentials.getAllCookieValues(emails);
    sendDataToAppleWatch(user, preferences, cookieValues);
}
