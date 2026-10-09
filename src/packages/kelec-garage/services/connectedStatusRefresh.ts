import Account from "../../../lib/clients/accounts/account";
import RenaultAccount from "../../../lib/clients/accounts/renaultAccount";
import RenaultClient from "../../../lib/clients/carMakers/renaultClient";
import { ConnectedStatusRepository } from "./connectedStatusRepository";

/** Délai entre deux appels à l'API pour une même voiture. */
export const CONNECTED_STATUS_REFRESH_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Rafraîchit le `connectedStatus` d'une voiture Renault / Dacia / Alpine, au plus une fois tous les 3 jours.
 * Couvre aussi les voitures ajoutées avant qu'on l'enregistre (aucune date de vérification).
 *
 * - Après une réponse de l'API, la date de vérification est notée, même si la voiture n'a pas de `connectedStatus`
 *   (thermique, supprimée du compte constructeur, ou réponse dégradée) : on retentera dans 3 jours.
 * - Un `connectedStatus` absent de la réponse n'efface pas celui déjà enregistré.
 * - En cas d'échec (réseau, identifiants…), on ne note rien : on retentera au prochain chargement.
 *
 * Le compte n'est pas modifié. Renvoie true si un `connectedStatus` a été enregistré.
 */
export async function refreshConnectedStatus(account: Account, now: number = Date.now()): Promise<boolean> {
    const car = account.getCar();
    if (!(account instanceof RenaultAccount) || car === undefined) return false;

    const vin = car.getVin();
    try {
        const lastCheckedAt = await ConnectedStatusRepository.lastCheckedAt(vin);
        // une date dans le futur (horloge du téléphone changée) ne doit pas bloquer le rafraîchissement
        if (lastCheckedAt !== null && lastCheckedAt <= now && now - lastCheckedAt < CONNECTED_STATUS_REFRESH_DELAY_MS) return false;

        const client = new RenaultClient(account.getEmail(), account.getPassword(), account.getKamereonAccountID());
        const response = await client.getVehicles();
        if (response.hasError) return false;

        const connectedStatus = response.vehicles.find(vehicle => vehicle.vin === vin)?.connectedStatus;
        if (connectedStatus) {
            await ConnectedStatusRepository.save(vin, connectedStatus, now);
            return true;
        }
        await ConnectedStatusRepository.markChecked(vin, now);
        return false;
    } catch {
        return false;
    }
}
