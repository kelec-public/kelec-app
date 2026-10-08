import { useCallback, useContext, useMemo, useState } from "react";
import { Alert } from "react-native";
import MainContext from "../../../lib/Contexts/MainContext";
import { useChargesHistory } from "../../kelec-charge-history";
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
    const { history, importCharges } = useChargesHistory();

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
            setPending({ fileName: file.name, preview: buildImportPreview(rows, history.getCharges()) });
        } catch (error) {
            console.log('Import de charges : lecture du fichier impossible', error);
            setPending(null);
            Alert.alert(t("error"), t("errorReadingFile"));
        } finally {
            setIsReading(false);
        }
    }, [history, t]);

    const summary = useMemo<ImportSummary | null>(
        () => pending && summarizeImport(history.getCharges(), pending.preview),
        [history, pending],
    );

    const newChargesCount = pending?.preview.newCharges.length ?? 0;
    const canImport = importCharges !== null && newChargesCount > 0 && !isSaving;

    const confirmImport = useCallback(async () => {
        if (!pending || importCharges === null) return;
        setIsSaving(true);
        try {
            await importCharges(pending.preview.newCharges);
            Alert.alert(t("success"), t("importSuccess"));
            onImported();
        } catch (error) {
            console.log('Import de charges : enregistrement impossible', error);
            Alert.alert(t("error"), t("errorSavingImportedCharges"));
        } finally {
            setIsSaving(false);
        }
    }, [pending, importCharges, onImported, t]);

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
