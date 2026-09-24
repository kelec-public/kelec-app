import { Alert, Share } from "react-native";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import { getWidgetsLogs } from "../../../lib/storage/sharedPlatformsData";

/** (Debug) Exporte les logs des widgets dans un fichier JSON et ouvre la feuille de partage. */
export async function exportWidgetLogs(): Promise<void> {
    const logs = await getWidgetsLogs();
    if (logs === null) {
        Alert.alert('No logs found');
        return;
    }

    const path = `${DocumentDirectoryPath}/exportLogs.json`;
    try {
        await writeFile(path, logs, 'utf8');
        Share.share({ url: 'file://' + path })
            .then(res => console.log(res))
            .catch(err => {
                Alert.alert('Erreur 2');
                err && console.log(err);
            });
    } catch (e) {
        Alert.alert('Erreur 1 : ' + e);
    }
}
