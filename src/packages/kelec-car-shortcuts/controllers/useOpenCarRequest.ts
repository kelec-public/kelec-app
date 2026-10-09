import { useEffect, useRef } from "react";
import { consumeOpenCarRequest, onOpenCarRequested } from "../services/openCarRequests";

/**
 * Appelle `onOpenCar` avec le VIN demandé par Spotlight, un raccourci ou un widget :
 * au montage (app lancée par la demande), puis à chaque nouvelle demande.
 */
export function useOpenCarRequest(onOpenCar: (vin: string) => void): void {
    const onOpenCarRef = useRef(onOpenCar);
    onOpenCarRef.current = onOpenCar;

    useEffect(() => {
        let isMounted = true;
        const consume = async () => {
            const vin = await consumeOpenCarRequest();
            if (isMounted && vin) {
                onOpenCarRef.current(vin);
            }
        };

        consume();
        const unsubscribe = onOpenCarRequested(consume);
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);
}
