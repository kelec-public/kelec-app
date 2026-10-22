import { useCallback, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import { Charge, useChargesHistory } from "../../kelec-charge-history";
import { ImportPreview, ImportSummary } from "../models/ImportPreview";
import { buildImportPreview, summarizeImport } from "../services/importPreview";
import { pickSpreadsheet } from "../services/pickSpreadsheet";
import { readSpreadsheetRows } from "../services/readSpreadsheet";

/** Fichier lu, en attente de confirmation. */
type PendingImport = {
    fileName: string;
    preview: ImportPreview;
};

/**
 * État et actions de l'écran d'import : choix et lecture du fichier, aperçu, enregistrement.
 * `onImported` est appelé une fois les charges enregistrées (ex. retour à l'historique).
 */
export function useChargesImportController(onImported: () => void) {
    const { languageHandler } = useContext(MainContext);
    const { history, importCharges, costOverrides, importCostOverrides } = useChargesHistory();

    const [pending, setPending] = useState<PendingImport | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const t = useCallback((key: string) => languageHandler.getTranslation(key), [languageHandler]);

    const pickFile = useCallback(async () => {
        setIsReading(true);
        try {
            const file = await pickSpreadsheet();
            if (file === null) return; // annulé : on garde le fichier précédent

            const rows = readSpreadsheetRows(file.base64);
            const hasManualCost = (charge: Charge) => costOverrides.get(charge) !== null;
            setPending({ fileName: file.name, preview: buildImportPreview(rows, history.getCharges(), undefined, hasManualCost) });
        } catch (error) {
            console.log('Import de charges : lecture du fichier impossible', error);
            setPending(null);
            Alert.alert(t("error"), t("errorReadingFile"));
        } finally {
            setIsReading(false);
        }
    }, [history, costOverrides, t]);

    const summary = useMemo<ImportSummary | null>(
        () => pending && summarizeImport(history.getCharges(), pending.preview),
        [history, pending],
    );

    const newChargesCount = pending?.preview.newCharges.length ?? 0;
    const manualCostsCount = pending?.preview.manualCosts.length ?? 0;
    // des prix saisis suffisent : ils peuvent concerner des charges déjà dans l'historique
    const canImport = importCharges !== null && (newChargesCount > 0 || manualCostsCount > 0) && !isSaving;

    const confirmImport = useCallback(async () => {
        if (!pending || importCharges === null) return;
        setIsSaving(true);
        try {
            // les charges d'abord : les prix saisis peuvent porter sur elles
            if (pending.preview.newCharges.length > 0) await importCharges(pending.preview.newCharges);
            if (pending.preview.manualCosts.length > 0) await importCostOverrides(pending.preview.manualCosts);
            Alert.alert(t("success"), t("importSuccess"));
            onImported();
        } catch (error) {
            console.log('Import de charges : enregistrement impossible', error);
            Alert.alert(t("error"), t("errorSavingImportedCharges"));
        } finally {
            setIsSaving(false);
        }
    }, [pending, importCharges, importCostOverrides, onImported, t]);

    return {
        fileName: pending?.fileName ?? null,
        preview: pending?.preview ?? null,
        summary,
        isReading,
        isSaving,
        canImport,
        pickFile,
        confirmImport,
    };
}
