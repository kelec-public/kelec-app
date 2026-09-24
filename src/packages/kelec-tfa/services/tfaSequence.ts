import RenaultTfaClient from "../../../lib/clients/carMakers/renault/renaultTfaClient";
import { TfaEmail } from "../../../lib/clients/carMakers/renault/renaultTfaModels";

/** Démarre le TFA Renault et envoie un premier code ; renvoie l'adresse (masquée) qui l'a reçu. */
export async function startTfa(client: RenaultTfaClient): Promise<TfaEmail> {
    await client.getDeviceId();
    await client.initTfaSequence();
    const email = await client.getTfaEmails();
    await client.sendTfaCode();
    return email;
}

/** Valide le code saisi et termine l'enregistrement de l'appareil. */
export async function validateTfa(client: RenaultTfaClient, code: string): Promise<void> {
    await client.validateTfaCode(code);
    await client.finalizeTfa();
    await client.finalizeRegistration();
}
