import { Platform, Share } from "react-native";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import ShareThirdPart from 'react-native-share';
import XLSX from 'xlsx';
import Charge from "../models/Charge";

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Une ligne par charge, dates converties en heure locale. */
const toRows = (charges: Charge[]) => charges.map(charge => ({
    ...charge,
    chargeStartDate: charge.getStartDate().toLocaleString(),
    chargeEndDate: charge.getEndDate().toLocaleString(),
}));

const buildWorkbook = (charges: Charge[]): string => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(charges)), "Charges");
    return XLSX.write(wb, { type: 'binary', bookType: "xlsx" });
};

/** Génère un fichier xlsx des charges (dans l'ordre donné) et ouvre la feuille de partage. */
export async function exportCharges(charges: Charge[]): Promise<void> {
    const path = `${DocumentDirectoryPath}/export${Date.now()}.xlsx`;
    try {
        await writeFile(path, buildWorkbook(charges), 'ascii');
    } catch (error) {
        console.log('error', error);
        return;
    }

    // La feuille de partage n'est pas attendue : fermer sans partager la fait rejeter.
    const url = `file://${path}`;
    const sharing = Platform.OS === 'ios'
        ? Share.share({ url })
        : ShareThirdPart.open({ title: 'Share Excel File', url, type: XLSX_MIME });
    sharing?.catch(err => err && console.log(err));
}
