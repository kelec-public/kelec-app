import Account from "../../../lib/clients/accounts/account";
import CarModel from "../../../lib/clients/cars/carModel";
import { LoginResult } from "../models/loginResult";

/** Connexion au compte d'un constructeur et liste de ses voitures. */
export interface LoginSource {
    authenticate(email: string, password: string): Promise<LoginResult>;
    /** Lève une erreur si la liste ne peut pas être récupérée. */
    listVehicles(account: Account): Promise<CarModel[]>;
}
