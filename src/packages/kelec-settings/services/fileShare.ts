import { Alert, Platform, Share } from "react-native";
import { DocumentDirectoryPath, writeFile } from "react-native-fs";
import ShareThirdPart from 'react-native-share';

/** (Debug) Écrit `content` dans un fichier des documents de l'app et ouvre la feuille de partage. */
export async function shareTextFile(fileName: string, content: string, mimeType: string): Promise<void> {
    const path = `${DocumentDirectoryPath}/${fileName}`;
    try {
        await writeFile(path, content, 'utf8');
    } catch (e) {
        Alert.alert('Unable to write the file: ' + e);
        return;
    }

    // `url` n'est géré que par le partage iOS : sur Android, le fichier passe par react-native-share.
    // Fermer la feuille sans partager la fait rejeter : pas d'alerte dans ce cas.
    const url = 'file://' + path;
    const sharing = Platform.OS === 'ios'
        ? Share.share({ url })
        : ShareThirdPart.open({ title: fileName, url, type: mimeType });
    sharing?.catch(err => err && console.log(err));
}
