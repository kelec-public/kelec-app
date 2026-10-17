import { useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import uuid from 'react-native-uuid';
import MainContext from "../../../lib/Contexts/MainContext";
import { TariffSettings } from "../models/Tariff";
import { draftFromTariff, newDraft, TariffDraft, tariffFromDraft } from "../models/tariffDraft";
import { TariffRepository } from "../services/tariffRepository";
import { canDeleteTariff, deleteTariff, upsertTariff } from "../services/tariffList";

/**
 * Page de saisie d'un tarif : celui dont l'id est donné, ou un nouveau tarif.
 * `onDone` est appelé après l'enregistrement ou la suppression.
 */
export function useTariffEditor(tariffId: string | undefined, onDone: () => void) {
    const { languageHandler } = useContext(MainContext);
    const t = (key: string) => languageHandler.getTranslation(key);

    const [settings, setSettings] = useState<TariffSettings | null>(null);
    const [draft, setDraft] = useState<TariffDraft | null>(null);

    useEffect(() => {
        TariffRepository.get().then(loaded => {
            const tariff = loaded.tariffs.find(other => other.id === tariffId);
            setSettings(loaded);
            setDraft(tariff ? draftFromTariff(tariff) : newDraft(uuid.v4() as string, loaded.tariffs, new Date()));
        });
    }, [tariffId]);

    const showError = (errorKey: string) => Alert.alert(t("error"), t(errorKey));

    const updateDraft = (patch: Partial<TariffDraft>) => {
        setDraft(current => current && { ...current, ...patch });
    };

    const save = async () => {
        if (!settings || !draft) return;
        const tariff = tariffFromDraft(draft);
        if (!tariff.ok) return showError(tariff.errorKey);
        const tariffs = upsertTariff(settings.tariffs, tariff.value);
        if (!tariffs.ok) return showError(tariffs.errorKey);
        await TariffRepository.save({ ...settings, tariffs: tariffs.value });
        onDone();
    };

    const remove = () => {
        if (!settings || !draft) return;
        const tariffs = deleteTariff(settings.tariffs, draft.id);
        if (!tariffs.ok) return showError(tariffs.errorKey);
        Alert.alert(t("deleteTariff"), t("deleteTariffMessage"), [
            { text: t("cancel"), style: 'cancel' },
            {
                text: t("confirm"), style: 'destructive', onPress: async () => {
                    await TariffRepository.save({ ...settings, tariffs: tariffs.value });
                    onDone();
                },
            },
        ]);
    };

    return {
        settings,
        draft,
        // un nouveau tarif n'est pas encore dans la liste : rien à supprimer
        canDelete: !!settings && !!draft && canDeleteTariff(settings.tariffs, draft.id),
        updateDraft,
        save,
        remove,
    };
}
