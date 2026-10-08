import Account from "../../../lib/clients/accounts/account";
import RenaultAccount from "../../../lib/clients/accounts/renaultAccount";
import RenaultClient from "../../../lib/clients/carMakers/renaultClient";
import { VinStorage } from "../../kelec-storage/vinStorage";
import { AccountRepository } from "./accountRepository";
import { GarageService } from "./garageService";

/** Marqueur posé une fois que l'API a répondu pour ce VIN : on ne la rappelle plus ensuite. */
const DONE_KEY = 'registrationCountryRetrofit';

/** Les voitures du pager sont rattrapées en parallèle : les écritures du compte passent l'une après l'autre. */
let saveQueue: Promise<unknown> = Promise.resolve();
const serialized = <T>(task: () => Promise<T>): Promise<T> => {
    const run = saveQueue.then(task);
    saveQueue = run.catch(() => undefined);
    return run;
};

/** Relit le compte enregistré, y ajoute le pays et l'enregistre. false si la voiture n'est plus dans le garage. */
const saveCountry = (vin: string, country: string): Promise<boolean> => serialized(async () => {
    const stored = await AccountRepository.load();
    return stored !== null && new GarageService(stored).setRegistrationCountry(vin, country);
});

/**
 * Rattrapage du pays d'immatriculation pour les voitures Renault / Dacia / Alpine ajoutées avant qu'on l'enregistre.
 *
 * Un seul appel réussi par voiture : une fois la liste des véhicules reçue, le marqueur est posé,
 * même si la voiture n'y est plus (supprimée du compte constructeur) ou n'a pas de pays.
 * En cas d'échec (réseau, identifiants…), on ne fait rien : ni pays, ni marqueur.
 *
 * Le compte est relu juste avant l'enregistrement : une voiture supprimée ou renommée pendant l'appel n'est pas écrasée.
 * La voiture en mémoire (`account`) reçoit aussi le pays, pour l'affichage.
 *
 * Renvoie true si le pays a été enregistré.
 */
export async function retrofitRegistrationCountry(account: Account): Promise<boolean> {
    const car = account.getCar();
    if (!(account instanceof RenaultAccount) || car === undefined || car.getRegistrationCountry()) return false;

    const vin = car.getVin();
    try {
        if (await VinStorage.getString(vin, DONE_KEY) !== null) return false;

        const client = new RenaultClient(account.getEmail(), account.getPassword(), account.getKamereonAccountID());
        const response = await client.getVehicles();
        if (response.hasError) return false;

        // voiture absente (supprimée du compte constructeur) ou sans pays : rien à enregistrer
        const country = response.vehicles.find(vehicle => vehicle.vin === vin)?.vehicleDetails.registrationCountry?.code;
        const saved = country !== undefined && country !== '' && await saveCountry(vin, country);
        if (saved) car.setRegistrationCountry(country);

        await VinStorage.setString(vin, DONE_KEY, 'true');
        return saved;
    } catch {
        return false;
    }
}
