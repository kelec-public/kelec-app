import { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import Dialog from "react-native-dialog";
import MainContext from "../../../lib/Contexts/MainContext";

type Props = {
    readonly visible: boolean;
    readonly currentName: string;
    readonly onCancel: () => void;
    readonly onConfirm: (name: string) => void;
}

function RenameCarDialog({ visible, currentName, onCancel, onConfirm }: Props): React.JSX.Element {
    const { languageHandler } = useContext(MainContext);
    const [name, setName] = useState(currentName);

    // repart du nom actuel à chaque ouverture
    useEffect(() => {
        if (visible) setName(currentName);
    }, [visible, currentName]);

    return (
        <View>
            <Dialog.Container visible={visible}>
                <Dialog.Title>{languageHandler.getTranslation("renameCar")}</Dialog.Title>
                <Dialog.Input
                    testID="carNameInput"
                    value={name}
                    onChangeText={setName}
                />
                <Dialog.Button
                    testID="carNameModalCancel"
                    label={languageHandler.getTranslation("cancel")}
                    onPress={onCancel} />
                <Dialog.Button
                    testID="carNameModalConfirm"
                    label={languageHandler.getTranslation("confirm")}
                    onPress={() => onConfirm(name)} />
            </Dialog.Container>
        </View>
    )
}

export default RenameCarDialog;
