import { useEffect, useState } from "react";
import { CarImageRepository } from "../services/carImageRepository";

/** Image enregistrée d'une voiture ('' tant qu'elle n'est pas chargée ou si elle n'existe pas). */
export function useCarImage(vin: string): string {
    const [image, setImage] = useState('');

    useEffect(() => {
        let isMounted = true;
        CarImageRepository.get(vin).then(stored => {
            if (isMounted && stored) setImage(stored);
        });
        return () => {
            isMounted = false;
        };
    }, [vin]);

    return image;
}
