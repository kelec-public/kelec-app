import fetchImage from "../../../lib/graphics/imageFetcher";

/** Images déjà téléchargées pendant l'ajout, par URL : évite de les retélécharger à la confirmation. */
const cache = new Map<string, Promise<string | null>>();

/** Image (base64) d'une voiture proposée à l'ajout ; null si elle ne peut pas être téléchargée. */
export function fetchVehicleImage(url: string): Promise<string | null> {
    if (!cache.has(url)) {
        const request = fetchImage(url).catch(() => null);
        cache.set(url, request);
        // un échec n'est pas mis en cache : on pourra réessayer
        request.then(image => { if (image == null) cache.delete(url); });
    }
    return cache.get(url)!;
}
