import { VinStorage } from "../../kelec-storage/vinStorage";
import { saveNativeImage } from "../../../lib/storage/sharedPlatformsData";

const KEY = 'image';

/** Photo d'une voiture (base64 JPEG), aussi transmise aux widgets natifs. */
export const CarImageRepository = {
    /** null si aucune image n'a été enregistrée. */
    async get(vin: string): Promise<string | null> {
        const image = await VinStorage.getString(vin, KEY);
        return image || null;
    },

    async save(vin: string, image: string): Promise<void> {
        await saveNativeImage(image, vin);
        await VinStorage.setString(vin, KEY, image);
    },
};

/** URI affichable par <Image>. */
export const toImageUri = (image: string): string => `data:image/jpeg;base64,${image}`;
