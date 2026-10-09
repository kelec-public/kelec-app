import Account from "../../../lib/clients/accounts/account";
import RenaultAccount from "../../../lib/clients/accounts/renaultAccount";
import RenaultClient from "../../../lib/clients/carMakers/renaultClient";
import { VinStorage } from "../../kelec-storage/vinStorage";
import { ConnectedStatusRepository } from "./connectedStatusRepository";

/** Marqueur posé une fois que l'API a répondu pour ce VIN : on ne la rappelle plus ensuite. */
const DONE_KEY = 'connectedStatusRetrofit';

/**
 * Rattrapage du `connectedStatus` pour les voitures Renault / Dacia / Alpine ajoutées avant qu'on l'enregistre.
 *
 * Un seul appel réussi par voiture : une fois la liste des véhicules reçue, le marqueur est posé,
 * même si la voiture n'y est plus (supprimée du compte constructeur) ou n'a pas de `connectedStatus`.
 * En cas d'échec (réseau, identifiants…), on ne fait rien : ni donnée, ni marqueur.
 *
 * Seule la clé `<vin>/connectedStatus` est écrite : le compte n'est pas modifié.
 *
 * Renvoie true si le `connectedStatus` a été enregistré.
 */
export async function retrofitConnectedStatus(account: Account): Promise<boolean> {
    const car = account.getCar();
    if (!(account instanceof RenaultAccount) || car === undefined) return false;

    const vin = car.getVin();
    try {
        if (await VinStorage.getString(vin, DONE_KEY) !== null) return false;
        if (await ConnectedStatusRepository.get(vin) !== null) return false;

        const client = new RenaultClient(account.getEmail(), account.getPassword(), account.getKamereonAccountID());
        const response = await client.getVehicles();
        if (response.hasError) return false;

        // voiture absente (supprimée du compte constructeur) ou sans connectivité : rien à enregistrer
        const connectedStatus = response.vehicles.find(vehicle => vehicle.vin === vin)?.connectedStatus;
        if (connectedStatus) await ConnectedStatusRepository.save(vin, connectedStatus);

        await VinStorage.setString(vin, DONE_KEY, 'true');
        return connectedStatus !== undefined;
    } catch {
        return false;
    }
}
