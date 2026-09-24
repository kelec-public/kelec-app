import UserAccount from "../../../lib/clients/accounts/userAccount";

export type UserDisplayName = { firstName: string; lastName: string };

/** Prénom et nom du dernier compte qui les fournit (comptes Renault), sinon null. */
export const getUserDisplayName = (user: UserAccount): UserDisplayName | null => {
    const withName = user.getCars()
        .filter(account => account.firstName !== undefined && account.lastName !== undefined)
        .pop();
    return withName ? { firstName: withName.firstName!, lastName: withName.lastName! } : null;
};
