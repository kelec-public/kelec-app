import { Alert, Platform, Share } from "react-native";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import ShareThirdPart from 'react-native-share';
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
        // `url` n'est géré que par le partage iOS : sur Android, le fichier passe par react-native-share.
        const url = 'file://' + path;
        const sharing = Platform.OS === 'ios'
            ? Share.share({ url })
            : ShareThirdPart.open({ title: 'Widget logs', url, type: 'application/json' });
        sharing
            ?.then(res => console.log(res))
            .catch(err => {
                Alert.alert('Error');
                err && console.log(err);
            });
    } catch (e) {
        Alert.alert('Erreur 1 : ' + e);
    }
}
