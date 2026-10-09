import { NativeEventEmitter, NativeModules } from "react-native";

/**
 * Module natif de la voiture à ouvrir, demandée par Spotlight, une Quick Action (iOS), un raccourci (Android)
 * ou un widget. Même API sur les deux plateformes (ios/Kelec/OpenCarRequests.swift,
 * android/.../bridge/OpenCarRequests.kt). Absent dans les tests.
 */
const nativeModule = () => NativeModules.OpenCarRequests;

const OPEN_CAR_REQUESTED = "openCarRequested";

/** Le VIN de la dernière demande, null s'il n'y en a pas. Une demande n'est lue qu'une fois. */
export async function consumeOpenCarRequest(): Promise<string | null> {
    try {
        return (await nativeModule()?.consume()) ?? null;
    } catch {
        return null;
    }
}

/** Prévient qu'une demande est arrivée (la lire avec consumeOpenCarRequest). Renvoie la désinscription. */
export function onOpenCarRequested(listener: () => void): () => void {
    const module = nativeModule();
    if (!module) {
        return () => { };
    }
    const subscription = new NativeEventEmitter(module).addListener(OPEN_CAR_REQUESTED, listener);
    return () => subscription.remove();
}
