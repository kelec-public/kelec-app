import UserAccount, { UserAccountInterface } from "../../../lib/clients/accounts/userAccount";
import { saveNativeAccount } from "../../../lib/storage/sharedPlatformsData";
import { AppStorage } from "../../kelec-storage/appStorage";
import { buildUserAccount } from "../models/userAccountFactory";
import { PasswordVault } from "./passwordVault";

const ACCOUNT_KEY = 'account';
/** Présent depuis la nouvelle interface d'ajout de voiture : sans lui, l'ancien compte est ignoré. */
const NEXT_GEN_KEY = 'kelecNextGen';

/** Copie JSON du compte sans aucun mot de passe, pour le stockage non chiffré (AsyncStorage, widgets). */
const withoutPasswords = (user: UserAccount): UserAccountInterface => {
    const copy: UserAccountInterface = JSON.parse(JSON.stringify(user));
    copy.cars.forEach(account => {
        account.password = '';
    });
    return copy;
};

/** Persistance du compte utilisateur (liste des voitures et comptes associés). */
export const AccountRepository = {
    /** null si aucun compte n'est enregistré (ou si c'est un compte de l'ancienne interface). */
    async load(): Promise<UserAccount | null> {
        const [stored, nextGen] = await Promise.all([
            AppStorage.getJSON<UserAccountInterface>(ACCOUNT_KEY),
            AppStorage.getString(NEXT_GEN_KEY),
        ]);
        if (stored === null || nextGen === null) return null;

        const { user, needsPasswordMigration } = await buildUserAccount(stored, PasswordVault.get);
        if (needsPasswordMigration) {
            await this.save(user);
        }
        return user;
    },

    /**
     * Enregistre les mots de passe dans le stockage chiffré, puis une copie sans mot de passe
     * dans AsyncStorage et pour les widgets. Le compte en mémoire n'est pas modifié.
     */
    async save(user: UserAccount): Promise<void> {
        await Promise.all(user.getCars().map(async account => {
            const vin = account.getCar()?.getVin();
            const password = account.getPassword();
            if (vin && password) await PasswordVault.save(vin, password);
        }));

        const stored = withoutPasswords(user);
        await saveNativeAccount(stored);
        await Promise.all([
            AppStorage.setJSON(ACCOUNT_KEY, stored),
            AppStorage.setString(NEXT_GEN_KEY, 'true'),
        ]);
    },
};
