import { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } from "@react-native-documents/picker";
import { readFile } from "react-native-fs";

/** Fichier choisi par l'utilisateur. */
export type PickedSpreadsheet = {
    name: string;
    base64: string;
};

const isCancellation = (error: unknown): boolean =>
    isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;

/** `file:///…/export%201.xlsx` → `/…/export 1.xlsx`, chemin attendu par react-native-fs. */
const toFilePath = (uri: string): string => decodeURIComponent(uri.replace(/^file:\/\//, ''));

/**
 * Ouvre le sélecteur de fichiers (xlsx / xls) et renvoie le contenu du fichier choisi,
 * ou null si l'utilisateur a annulé. Le fichier est d'abord copié dans le cache de l'app :
 * sur Android, le sélecteur renvoie une uri `content://` que react-native-fs ne sait pas lire.
 */
export const pickSpreadsheet = async (): Promise<PickedSpreadsheet | null> => {
    let picked;
    try {
        [picked] = await pick({ type: [types.xlsx, types.xls], mode: 'import' });
    } catch (error) {
        if (isCancellation(error)) return null;
        throw error;
    }

    const name = picked.name ?? 'charges.xlsx';
    const [copy] = await keepLocalCopy({
        files: [{ uri: picked.uri, fileName: name }],
        destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') {
        throw new Error(copy.copyError);
    }

    return { name, base64: await readFile(toFilePath(copy.localUri), 'base64') };
};
