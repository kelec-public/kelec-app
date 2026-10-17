import { Platform, Share } from "react-native";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import ShareThirdPart from 'react-native-share';
import XLSX from 'xlsx';
import Charge from "../models/Charge";
import { ChargeCosts } from "../models/ChargeCosts";

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Une ligne par charge, dates converties en heure locale.
 * Une charge fusionnée donne une seule ligne : le détail des sous-charges est remplacé par leur nombre.
 * Avec des tarifs, les colonnes `cost`, `currency` et `isManualCost` sont ajoutées avant les colonnes de fusion.
 */
export const toRows = (charges: Charge[], costs: ChargeCosts | null = null) => charges.map(charge => {
    // Les colonnes de fusion sont retirées puis ajoutées ensemble en fin de ligne.
    const { isAMergeCharge, subCharges, ...fields } = charge;
    const cost = costs?.costOf(charge) ?? null;
    return {
        ...fields,
        chargeStartDate: charge.getStartDate().toLocaleString(),
        chargeEndDate: charge.getEndDate().toLocaleString(),
        // coût (arrondi au centime) et devise : seulement si des tarifs sont définis
        ...(costs && {
            cost: cost === null ? undefined : Math.round(cost * 100) / 100,
            currency: costs.currency,
            isManualCost: costs.isManual(charge),
        }),
        isAMergeCharge: isAMergeCharge ?? false,
        subChargesCount: subCharges.length,
    };
});

const buildWorkbook = (charges: Charge[], costs: ChargeCosts | null): string => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(charges, costs)), "Charges");
    return XLSX.write(wb, { type: 'binary', bookType: "xlsx" });
};

/** Génère un fichier xlsx des charges (dans l'ordre donné) et ouvre la feuille de partage. */
export async function exportCharges(charges: Charge[], costs: ChargeCosts | null = null): Promise<void> {
    const path = `${DocumentDirectoryPath}/export${Date.now()}.xlsx`;
    try {
        await writeFile(path, buildWorkbook(charges, costs), 'ascii');
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
