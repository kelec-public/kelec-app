import { Alert } from "react-native";
import { getWidgetsLogs } from "../../../lib/storage/sharedPlatformsData";
import { shareTextFile } from "./fileShare";

/** (Debug) Exporte les logs des widgets dans un fichier JSON et ouvre la feuille de partage. */
export async function exportWidgetLogs(): Promise<void> {
    const logs = await getWidgetsLogs();
    if (logs === null) {
        Alert.alert('No logs found');
        return;
    }
    await shareTextFile('exportLogs.json', logs, 'application/json');
}
